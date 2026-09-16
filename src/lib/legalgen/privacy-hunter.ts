// src/lib/legalgen/privacy-hunter.ts
// Privacy Policy Hunter - Finds hidden privacy policies on any website

export interface PrivacyPolicyFound {
  url: string;
  confidence: number; // 0-100
  method: 'url-pattern' | 'html-link' | 'sitemap' | 'robots-txt' | 'api';
  title?: string;
  lastUpdated?: string;
  jurisdiction?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface HunterResult {
  targetUrl: string;
  foundPolicies: PrivacyPolicyFound[];
  scanTime: number;
  totalMethodsUsed: number;
  summary: {
    totalFound: number;
    highConfidence: number; // >80%
    mediumConfidence: number; // 50-80%
    lowConfidence: number; // <50%
  };
  competitorAnalysis?: {
    hasPrivacyPolicy: boolean;
    jurisdictionDetected: string;
    policyComplexity: 'simple' | 'moderate' | 'complex';
    lastUpdated?: string;
  };
}

// Common privacy policy URL patterns
const PRIVACY_URL_PATTERNS = [
  '/privacy',
  '/privacy-policy',
  '/privacy-policy.html',
  '/privacy-policy.php',
  '/legal/privacy',
  '/legal/privacy-policy',
  '/policies/privacy',
  '/policies/privacy-policy',
  '/data-protection',
  '/data-privacy',
  '/gdpr',
  '/ccpa',
  '/legal-notices/privacy',
  '/about/privacy',
  '/info/privacy',
  '/docs/privacy',
  '/terms/privacy',
];

// Keywords to look for in link text and URLs
const PRIVACY_KEYWORDS = [
  'privacy',
  'privacy policy',
  'privacy notice',
  'data protection',
  'personal data',
  'cookie policy',
  'gdpr',
  'ccpa',
  'data privacy',
  'information security',
  'data processing',
];

// Jurisdiction indicators
const JURISDICTION_INDICATORS: Record<string, { patterns: RegExp[]; name: string }> = {
  'EU': {
    patterns: [/gdpr/i, /general data protection regulation/i, /european commission/i, /article \d+.*gdpr/i, /data subject rights/i, /lawful basis/i],
    name: 'European Union (GDPR)'
  },
  'US-CA': {
    patterns: [/ccpa/i, /california consumer privacy/i, /california privacy rights/i, /shine the light/i, /do not sell/i, /opt.out.*sale/i],
    name: 'California (CCPA/CPRA)'
  },
  'US': {
    patterns: [/ftc/i, /federal trade commission/i, /coppa/i, /children.s online privacy/i, /hipaa/i, /glba/i, /gramm.leach.bliley/i],
    name: 'United States (Federal)'
  },
  'UK': {
    patterns: [/uk gdpr/i, /uk data protection/i, /data protection act 2018/i, /ico/i, /information commissioner/i, /pecr/i],
    name: 'United Kingdom (UK GDPR + DPA)'
  },
  'IN': {
    patterns: [/dpdp/i, /digital personal data protection/i, /it act/i, /information technology act/i, /grievance officer/i, /board of india/i, /meity/i],
    name: 'India (DPDP Act)'
  },
};

/**
 * Main function to hunt for privacy policies
 */
export async function huntPrivacyPolicy(websiteUrl: string): Promise<HunterResult> {
  const startTime = Date.now();
  const foundPolicies: PrivacyPolicyFound[] = [];
  const methodsUsed: string[] = [];

  try {
    const normalizedUrl = normalizeUrl(websiteUrl);
    
    // Method 1: Try common URL patterns
    console.log('[PrivacyHunter] Trying URL pattern detection...');
    const patternResults = await tryUrlPatterns(normalizedUrl);
    methodsUsed.push('url-pattern');
    foundPolicies.push(...patternResults);

    // Method 2: Scrape homepage for links
    console.log('[PrivacyHunter] Scraping homepage for links...');
    try {
      const htmlResults = await scrapeHomepageForLinks(normalizedUrl);
      methodsUsed.push('html-link');
      foundPolicies.push(...htmlResults);
    } catch (error) {
      console.log('[PrivacyHunter] Homepage scraping failed:', error);
    }

    // Method 3: Check sitemap.xml
    console.log('[PrivacyHunter] Checking sitemap...');
    try {
      const sitemapResults = await checkSitemap(normalizedUrl);
      if (sitemapResults.length > 0) {
        methodsUsed.push('sitemap');
        foundPolicies.push(...sitemapResults);
      }
    } catch (error) {
      console.log('[PrivacyHunter] Sitemap check failed:', error);
    }

    // Method 4: Check robots.txt
    console.log('[PrivacyHunter] Checking robots.txt...');
    try {
      const robotsResults = await checkRobotsTxt(normalizedUrl);
      if (robotsResults.length > 0) {
        methodsUsed.push('robots-txt');
        foundPolicies.push(...robotsResults);
      }
    } catch (error) {
      console.log('[PrivacyHunter] Robots.txt check failed:', error);
    }

    // Remove duplicates and sort by confidence
    const uniquePolicies = deduplicatePolicies(foundPolicies);
    
    // Enrich with additional data
    const enrichedPolicies = await enrichWithDetails(uniquePolicies);

    const summary = generateSummary(enrichedPolicies);
    const competitorAnalysis = generateCompetitorAnalysis(enrichedolicies, normalizedUrl);
    const scanTime = Date.now() - startTime;

    return {
      targetUrl: normalizedUrl,
      foundPolicies: enrichedPolicies,
      scanTime,
      totalMethodsUsed: methodsUsed.length,
      summary,
      competitorAnalysis,
    };

  } catch (error) {
    console.error('[PrivacyHunter] Error hunting privacy policy:', error);
    return {
      targetUrl: websiteUrl,
      foundPolicies: [],
      scanTime: Date.now() - startTime,
      totalMethodsUsed: 0,
      summary: { totalFound: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 0 },
    };
  }
}

function normalizeUrl(url: string): string {
  try {
    let normalized = url.trim();
    
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    const parsed = new URL(normalized);
    
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/$/, '');
    }
    
    return parsed.toString();
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

async function tryUrlPatterns(baseUrl: string): Promise<PrivacyPolicyFound[]> {
  const results: PrivacyPolicyFound[] = [];
  
  const batchSize = 5;
  for (let i = 0; i < PRIVACY_URL_PATTERNS.length; i += batchSize) {
    const batch = PRIVACY_URL_PATTERNS.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(pattern => testUrlPattern(baseUrl, pattern))
    );
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value!);
      }
    });
  }
  
  return results;
}

async function testUrlPattern(baseUrl: string, pattern: string): Promise<PrivacyPolicyFound | null> {
  try {
    const url = new URL(pattern, baseUrl).href;
    const startTest = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'LegalGen-PrivacyHunter/1.0 (Compliance Scanner)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTest;
    
    if (response.ok || response.status === 405) {
      return {
        url,
        confidence: 70,
        method: 'url-pattern',
        statusCode: response.status,
        responseTime,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function scrapeHomepageForLinks(baseUrl: string): Promise<PrivacyPolicyFound[]> {
  const results: PrivacyPolicyFound[] = [];
  
  try {
    const startScrape = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(baseUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LegalGen-PrivacyHunter/1.0 (Compliance Scanner)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return results;
    
    const html = await response.text();
    const scrapeTime = Date.now() - startScrape;
    
    const links = extractLinksFromHtml(html, baseUrl);
    
    for (const link of links) {
      if (isPrivacyRelated(link.text, link.href)) {
        results.push({
          url: link.href,
          confidence: 85,
          method: 'html-link',
          title: link.text || undefined,
          responseTime: scrapeTime,
        });
      }
    }
  } catch (error) {
    console.error('[PrivacyHunter] Homepage scraping error:', error);
  }
  
  return results;
}

interface ExtractedLink {
  text: string;
  href: string;
}

function extractLinksFromHtml(html: string, baseUrl: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    const text = match[2].trim();
    
    try {
      href = new URL(href, baseUrl).href;
    } catch {
      continue;
    }
    
    links.push({ text, href });
  }
  
  return links;
}

function isPrivacyRelated(text: string, href: string): boolean {
  const combinedText = `${text} ${href}`.toLowerCase();
  
  return PRIVACY_KEYWORDS.some(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );
}

async function checkSitemap(baseUrl: string): Promise<PrivacyPolicyFound[]> {
  const results: PrivacyPolicyFound[] = [];
  
  try {
    const sitemapUrls = [
      new URL('/sitemap.xml', baseUrl).href,
      new URL('/sitemap_index.xml', baseUrl).href,
    ];
    
    for (const sitemapUrl of sitemapUrls) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(sitemapUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'LegalGen-PrivacyHunter/1.0' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) continue;
      
      const xml = await response.text();
      
      const urlRegex = /<loc>([^<]*privacy[^<]*)<\/loc>/gi;
      let match;
      
      while ((match = urlRegex.exec(xml)) !== null) {
        results.push({
          url: match[1].trim(),
          confidence: 95,
          method: 'sitemap',
        });
      }
      
      if (results.length > 0) break;
    }
  } catch (error) {
    console.error('[PrivacyHunter] Sitemap check error:', error);
  }
  
  return results;
}

async function checkRobotsTxt(baseUrl: string): Promise<PrivacyPolicyFound[]> {
  const results: PrivacyPolicyFound[] = [];
  
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'LegalGen-PrivacyHunter/1.0' }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return results;
    
    const text = await response.text();
    
    const sitemapRegex = /^Sitemap:\s*(.*privacy.*)$/gim;
    let match;
    
    while ((match = sitemapRegex.exec(text)) !== null) {
      results.push({
        url: match[1].trim(),
        confidence: 60,
        method: 'robots-txt',
      });
    }
  } catch (error) {
    console.error('[PrivacyHunter] Robots.txt check error:', error);
  }
  
  return results;
}

function deduplicatePolicies(policies: PrivacyPolicyFound[]): PrivacyPolicyFound[] {
  const seen = new Map<string, PrivacyPolicyFound>();
  
  for (const policy of policies) {
    const existing = seen.get(policy.url);
    
    if (!existing || policy.confidence > existing.confidence) {
      seen.set(policy.url, policy);
    }
  }
  
  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
}

async function enrichWithDetails(policies: PrivacyPolicyFound[]): Promise<PrivacyPolicyFound[]> {
  const toEnrich = policies.slice(0, 3);
  const enriched = [...policies];
  
  for (let i = 0; i < toEnrich.length; i++) {
    try {
      const details = await fetchPolicyDetails(toEnrich[i].url);
      enriched[i] = { ...enriched[i], ...details };
    } catch (error) {
      console.error(`[PrivacyHunter] Failed to enrich ${toEnrich[i].url}:`, error);
    }
  }
  
  return enriched;
}

async function fetchPolicyDetails(url: string): Promise<Partial<PrivacyPolicyFound>> {
  const details: Partial<PrivacyPolicyFound> = {};
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'LegalGen-PrivacyHunter/1.0' }
    });
    
    clearTimeout(timeoutId);
    
    details.statusCode = response.status;
    
    if (!response.ok) return details;
    
    const html = await response.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      details.title = titleMatch[1].trim();
    }
    
    details.jurisdiction = detectJurisdiction(html);
    
    const datePatterns = [
      /last\s*(?:updated|revised|modified):\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /effective?\s*date:\s*(\d{1,2}\s+\w+\s+\d{4})/i,
      /(\w+\s+\d{1,2},?\s+\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = html.match(pattern);
      if (dateMatch) {
        details.lastUpdated = dateMatch[1];
        break;
      }
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
  }
  
  return details;
}

function detectJurisdiction(content: string): string {
  const lowerContent = content.toLowerCase();
  
  let bestMatch = '';
  let maxMatches = 0;
  
  for (const [code, config] of Object.entries(JURISDICTION_INDICATORS)) {
    const matches = config.patterns.filter(pattern => pattern.test(lowerContent)).length;
    
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = code;
    }
  }
  
  return maxMatches >= 2 ? bestMatch : 'UNKNOWN';
}

function generateSummary(policies: PrivacyPolicyFound[]) {
  return {
    totalFound: policies.length,
    highConfidence: policies.filter(p => p.confidence > 80).length,
    mediumConfidence: policies.filter(p => p.confidence >= 50 && p.confidence <= 80).length,
    lowConfidence: policies.filter(p => p.confidence < 50).length,
  };
}

function generateCompetitorAnalysis(policies: PrivacyPolicyFound[], targetUrl: string) {
  if (policies.length === 0) {
    return {
      hasPrivacyPolicy: false,
      jurisdictionDetected: 'None',
      policyComplexity: 'simple' as const,
    };
  }
  
  const bestPolicy = policies[0];
  const jurisdiction = bestPolicy.jurisdiction || 'UNKNOWN';
  
  const uniqueJurisdictions = new Set(
    policies.map(p => p.jurisdiction).filter(Boolean)
  );
  
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (uniqueJurisdictions.size > 2) complexity = 'complex';
  else if (uniqueJurisdictions.size > 1) complexity = 'moderate';
  
  return {
    hasPrivacyPolicy: true,
    jurisdictionDetected: JURISDICTION_INDICATORS[jurisdiction]?.name || jurisdiction,
    policyComplexity: complexity,
    lastUpdated: bestPolicy.lastUpdated,
  };
}