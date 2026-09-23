// backend/src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'dev-key-123';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// --- BUSINESS LOGIC ---
interface BusinessRule {
  name: string;
  indicators: { pattern: RegExp; weight: number }[];
  required: string[];
}

const BUSINESS_TYPE_RULES: Record<string, BusinessRule> = {
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

function detectBusinessType(htmlContent: string, url: string): BusinessRule {
  const lowerText = htmlContent.toLowerCase();
  const urlLower = url.toLowerCase();
  
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

interface FetchedPage {
  html: string;
  text: string;
  links: string[];
}

async function fetchPageContent(url: string): Promise<FetchedPage | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LegalGenBot/2.0)' },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const linkText = $(el).text().toLowerCase();
      if (href && (linkText.includes('privacy') || linkText.includes('terms') || linkText.includes('policy'))) {
        try { links.push(new URL(href, url).href); } catch {}
      }
    });

    return { html, text, links };
  } catch (error: any) {
    console.error(`Fetch error ${url}:`, error.message);
    return null;
  }
}

// --- API ROUTES ---

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/scan', async (req: Request, res: Response) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    if (!url.startsWith('http')) url = 'https://' + url;

    console.log(`🚀 Scanning: ${url}`);

    const homeData = await fetchPageContent(url);
    if (!homeData) {
      return res.status(502).json({ error: 'Failed to access website' });
    }

    const businessConfig = detectBusinessType(homeData.text, url);
    
    let fullText = homeData.text;
    const foundPages: { name: string; url: string }[] = [];
    
    for (const link of homeData.links.slice(0, 3)) {
      if (link === url) continue;
      const pageData = await fetchPageContent(link);
      if (pageData) {
        fullText += ' ' + pageData.text;
        const pathName = new URL(link).pathname.toLowerCase();
        let name = 'Legal Page';
        if (pathName.includes('privacy')) name = 'Privacy Policy';
        else if (pathName.includes('term')) name = 'Terms of Service';
        else if (pathName.includes('refund')) name = 'Refund Policy';
        else if (pathName.includes('cookie')) name = 'Cookie Policy';
        
        foundPages.push({ name, url: link });
      }
    }

    const missingPages = businessConfig.required.filter((reqPage) => 
      !foundPages.some(p => p.name.toLowerCase() === reqPage.toLowerCase())
    );

    const score = Math.max(0, 100 - (missingPages.length * 25));
    
    const results = businessConfig.required.map((pageName) => {
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

    res.json({
      success: true,
      text: fullText,
      data: {
        url,
        businessType: businessConfig.name,
        score,
        foundPages,
        missingPages,
        results
      }
    });

  } catch (error: any) {
    console.error('❌ Scan Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Scan: http://localhost:${PORT}/api/scan`);
});