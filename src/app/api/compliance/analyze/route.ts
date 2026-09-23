import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// --- CONFIGURATION ---
const MAX_PAGES_TO_SCAN = 3;
const TIMEOUT_MS = 8000;

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

async function fetchPageContent(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LegalGenBot/2.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const html = await res.text();
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
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    console.log(`🚀 Starting scan for: ${url}`);

    // 1. Scan Homepage
    const homeData = await fetchPageContent(url);
    if (!homeData) {
      return NextResponse.json({ error: 'Failed to access website. Check URL or firewall.' }, { status: 502 });
    }

    // 2. Detect Business Type
    const businessConfig = detectBusinessType(homeData.text, url);
    console.log(`🏢 Detected: ${businessConfig.name}`);

    // 3. Scan Found Legal Pages (Limited to prevent timeout)
    let fullText = homeData.text;
    const foundPages: { name: string; url: string }[] = [];
    
    // Simple heuristic to name pages based on URL
    for (const link of homeData.links.slice(0, MAX_PAGES_TO_SCAN)) {
      if (link === url) continue;
      const pageData = await fetchPageContent(link);
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

  } catch (error: any) {
    console.error('❌ Scan Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal scanner error' }, 
      { status: 500 }
    );
  }
}