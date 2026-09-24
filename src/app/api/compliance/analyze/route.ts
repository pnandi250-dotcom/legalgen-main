import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { route } from '@/lib/api/handler';
import { quickScanRequest } from '@/lib/validation/schemas';
import { consumeQuota } from '@/lib/quota';
import {
  safeFetch,
  parseUserUrl,
  assertPublicUrl,
  UrlGuardError,
} from '@/lib/security/url-guard';

// Keep this route on the Node runtime and give it a real time budget.
export const runtime = 'nodejs';
export const maxDuration = 60;

// --- CONFIGURATION ---
const MAX_PAGES_TO_SCAN = 3;
const TIMEOUT_MS = 8000;
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// --- BUSINESS LOGIC ---
const BUSINESS_TYPE_RULES: Record<string, any> = {
  ecommerce: {
    name: 'E-Commerce',
    indicators: [
      { pattern: /add.to.cart|checkout|buy.now/gi, weight: 10 },
      { pattern: /shipping|refund|delivery/gi, weight: 9 },
      { pattern: /product|price|offer/gi, weight: 8 },
    ],
    required: ['Privacy Policy', 'Refund Policy', 'Terms of Service', 'Shipping Policy']
  },
  saas: {
    name: 'SaaS/Tech',
    indicators: [
      { pattern: /sign.up|free.trial|pricing/gi, weight: 9 },
      { pattern: /api|dashboard|login/gi, weight: 8 },
    ],
    required: ['Privacy Policy', 'Terms of Service', 'SLA', 'Acceptable Use']
  },
  finance: {
    name: 'Finance',
    indicators: [
      { pattern: /loan|invest|stock|banking/gi, weight: 10 },
      { pattern: /rbi|sebi|kyc/gi, weight: 9 },
    ],
    required: ['Privacy Policy', 'Risk Disclosure', 'Grievance Redressal', 'KYC Policy']
  },
  healthcare: {
    name: 'Healthcare',
    indicators: [
      { pattern: /doctor|medicine|consultation/gi, weight: 9 },
      { pattern: /patient|medical|hospital/gi, weight: 8 },
    ],
    required: ['Privacy Policy', 'Medical Disclaimer', 'Patient Consent']
  },
  default: {
    name: 'General Business',
    indicators: [],
    required: ['Privacy Policy', 'Terms of Service', 'Cookie Policy']
  }
};

function detectBusinessType(htmlContent: string, url: string) {
  const lowerText = htmlContent.toLowerCase();
  let bestScore = 0;
  let bestType = 'default';

  for (const [key, config] of Object.entries(BUSINESS_TYPE_RULES)) {
    if (key === 'default') continue;
    let score = 0;
    for (const ind of config.indicators) {
      const matches = lowerText.match(ind.pattern);
      if (matches) score += matches.length * ind.weight;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = key;
    }
  }
  return BUSINESS_TYPE_RULES[bestType] || BUSINESS_TYPE_RULES.default;
}

/** Shared post-processing: extract visible text + legal links from raw HTML. */
function parseHtml(url: string, html: string) {
  const $ = cheerio.load(html);

  // Clean content
  $('script, style, noscript, iframe').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();

  // Extract legal links
  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const linkText = $(el).text().toLowerCase();
    if (href && (linkText.includes('privacy') || linkText.includes('terms') || linkText.includes('policy'))) {
      try {
        links.push(new URL(href, url).href);
      } catch {}
    }
  });

  return { html, text, links };
}

/**
 * Fast path: SSRF-safe HTTP fetch (works for server-rendered sites).
 *
 * MUST go through safeFetch(): it blocks localhost / cloud-metadata IPs /
 * private ranges / dangerous ports, caps redirects and response size, and
 * enforces a timeout. Never call raw fetch() with a user-supplied URL here.
 */
async function fetchPageContent(url: string) {
  try {
    const result = await safeFetch(url, {
      timeoutMs: TIMEOUT_MS,
      maxBytes: 2 * 1024 * 1024,
      maxRedirects: 3,
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (result.status >= 400) return null;

    return parseHtml(result.finalUrl, result.body);
  } catch (error) {
    // Re-throw guard violations so the caller can surface a 4xx refusal
    // instead of silently treating an internal-target block as "site down".
    if (error instanceof UrlGuardError && error.code.startsWith('BLOCKED')) {
      throw error;
    }
    // Everything else (DNS failure, timeout, non-HTML content type, ...) is
    // a normal scan miss — log internally, never leak the message to clients.
    console.warn(
      JSON.stringify({ event: 'analyze_fetch_failed', url, code: error instanceof UrlGuardError ? error.code : 'ERROR' }),
    );
    return null;
  }
}

/**
 * Fallback path: render the page with a headless browser so JavaScript-only
 * sites (React/Vue SPAs like dekhtehai.in) are scanned correctly instead of
 * returning an empty body. Returns null if Playwright/Chromium isn't available
 * on this deployment — in that case we degrade gracefully to static fetch only.
 */
/**
 * Shared Chromium instance for the headless render path.
 *
 * Playwright's route interception sees the URL string only — it cannot stop
 * Chromium from resolving a hostname to an internal IP at connect time, so
 * relying on `route.abort()` alone would leave a DNS-rebinding SSRF hole in
 * the browser fallback (the guard checks DNS, then Chromium re-resolves).
 *
 * Instead we hard-disable outbound traffic at the network layer with
 * `--host-resolver-rules="MAP * ~NOTFOUND"`, which makes Chromium fail to
 * resolve ANY hostname. The browser path therefore never reaches the network
 * at all; if this ever changes (e.g. a proxy is added), the launch below must
 * be paired with per-IP validation before continuing requests.
 */
let browserPromise: Promise<any | null> | null = null;
async function getBrowser(): Promise<any | null> {
  if (!browserPromise) {
    browserPromise = (async () => {
      try {
        const pw = await import('playwright');
        return await pw.chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--host-resolver-rules=MAP * ~NOTFOUND',
          ],
        });
      } catch (e) {
        console.warn('Headless browser unavailable, using static fetch only:', e);
        return null;
      }
    })();
  }
  return browserPromise;
}

async function renderPageContent(url: string) {
  // Resolve + validate the target through the shared guard BEFORE rendering.
  // Blocked/private targets throw UrlGuardError -> clean 400 via the handler.
  const target = parseUserUrl(url);
  await assertPublicUrl(target);

  const browser = await getBrowser();
  if (!browser) return null;
  let ctx: any = null;
  let page: any = null;
  try {
    ctx = await browser.newContext({ userAgent: BROWSER_UA });

    // Belt and braces: even though DNS is disabled globally, only allow the
    // exact vetted document URL to proceed; everything else is aborted.
    await ctx.route('**/*', async (routeHandler: any) => {
      const req = routeHandler.request();
      let reqUrl: URL | null = null;
      try {
        reqUrl = new URL(req.url());
      } catch {
        await routeHandler.abort();
        return;
      }
      const sameHost =
        reqUrl.hostname.toLowerCase().replace(/\.$/, '') ===
        target.hostname.toLowerCase().replace(/\.$/, '');
      if (
        req.resourceType() === 'document' &&
        sameHost &&
        (reqUrl.protocol === 'http:' || reqUrl.protocol === 'https:')
      ) {
        await routeHandler.continue();
      } else {
        await routeHandler.abort();
      }
    });

    page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Give client-side routers a moment to paint footer/legal links
    await page.waitForTimeout(1500);
    const html = await page.content();
    return parseHtml(url, html);
  } catch (error) {
    if (error instanceof UrlGuardError) throw error;
    console.warn(JSON.stringify({ event: 'analyze_render_failed', url }));
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
    if (ctx) await ctx.close().catch(() => {});
  }
}

/** Fetch with automatic headless-browser fallback for JS-rendered sites. */
async function fetchPageWithFallback(url: string) {
  const staticData = await fetchPageContent(url);
  if (staticData && staticData.text.length >= 200) return staticData;

  console.log(`Static fetch returned little/no text for ${url} - trying headless browser...`);
  const rendered = await renderPageContent(url);
  if (rendered && rendered.text.length > (staticData?.text.length ?? 0)) return rendered;
  return staticData ?? rendered;
}

export const POST = route(
  { schema: quickScanRequest },
  async ({ body, user, request, log }) => {
    // Auth + quota (same policy as /api/compliance/scan): anonymous callers
    // get the IP-based anonymous allowance; logged-in users get their plan's.
    await consumeQuota(user, request, 'scan');

    // parseUserUrl normalises bare domains ("example.com" -> "https://...")
    // and rejects non-http(s) schemes before anything touches the network.
    const target = parseUserUrl(body.url);
    const url = target.toString();

    log('analyze_start', { host: target.hostname });

    // 1. Scan Homepage (SSRF-safe fetch with JS-rendering fallback).
    // Blocked/private targets throw UrlGuardError -> handler returns a clean
    // 400 with no internals; unreachable sites return null -> 502 below.
    const homeData = await fetchPageWithFallback(url);
    if (!homeData) {
      return NextResponse.json(
        { success: false, error: 'Failed to access website. Check the URL and try again.' },
        { status: 502 },
      );
    }

    // 2. Detect Business Type
    const businessConfig = detectBusinessType(homeData.text, url);

    // 3. Scan Found Legal Pages (Limited to prevent timeout).
    // Links are extracted from attacker-controlled HTML, so each one is
    // re-validated through the guard inside fetchPageContent/safeFetch —
    // a malicious page cannot use us to probe internal hosts either.
    let fullText = homeData.text;
    const foundPages: { name: string; url: string }[] = [];

    for (const link of homeData.links.slice(0, MAX_PAGES_TO_SCAN)) {
      if (link === url) continue;
      let pageData: Awaited<ReturnType<typeof fetchPageWithFallback>> | null = null;
      try {
        pageData = await fetchPageWithFallback(link);
      } catch (error) {
        // Guard refused this link (private IP, blocked port, ...). Skip it;
        // never follow links into internal space.
        if (error instanceof UrlGuardError) {
          log('analyze_link_blocked', { code: error.code });
          continue;
        }
        throw error;
      }
      if (pageData) {
        fullText += ' ' + pageData.text;
        // Infer name from URL
        const pathName = new URL(link).pathname.toLowerCase();
        let name = 'Legal Page';
        if (pathName.includes('privacy')) name = 'Privacy Policy';
        else if (pathName.includes('term')) name = 'Terms of Service';
        else if (pathName.includes('refund')) name = 'Refund Policy';
        else if (pathName.includes('cookie')) name = 'Cookie Policy';

        foundPages.push({ name, url: link });
      }
    }

    // 4. Calculate Compliance
    const missingPages = businessConfig.required.filter((req: string) =>
      !foundPages.some(p => p.name.toLowerCase() === req.toLowerCase())
    );

    const score = Math.max(0, 100 - (missingPages.length * 25));

    // 5. Construct Response matching your Frontend Expectations
    const complianceResults = businessConfig.required.map((pageName: string) => {
      const found = foundPages.some(p => p.name.toLowerCase() === pageName.toLowerCase());
      return {
        type: pageName.toLowerCase().replace(/\s+/g, '-'),
        label: pageName,
        page: pageName,
        found: found,
        url: found ? foundPages.find(p => p.name === pageName)?.url || url : null,
        source: found ? 'Detected' : '',
        severity: ['Privacy Policy', 'Terms of Service'].includes(pageName) ? 'critical' : 'important',
        description: `Required for ${businessConfig.name}`,
        generateType: pageName.toLowerCase().replace(/\s+/g, '-')
      };
    });

    return NextResponse.json({
      success: true,
      text: fullText,
      data: {
        url,
        businessType: businessConfig.name,
        score,
        foundPages,
        missingPages,
        results: complianceResults
      }
    });
  },
);