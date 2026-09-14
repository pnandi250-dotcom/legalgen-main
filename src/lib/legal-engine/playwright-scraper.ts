import { chromium, type Browser, type Page } from 'playwright';

export interface ScrapingResult {
  url: string;
  html: string;
  text: string;
  title: string;
  links: string[];
  scripts: string[];
  metaTags: Record<string, string>;
  hasCookies: boolean;
  hasAnalytics: boolean;
  loadTime: number;
}

class PlaywrightScraper {
  private browser: Browser | null = null;
  
  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  
  async scrapeWebsite(url: string, timeout = 30000): Promise<ScrapingResult> {
    if (!this.browser) await this.initialize();
    
    const startTime = Date.now();
    const page = await this.browser!.newPage();
    
    try {
      // Set user agent to avoid bot detection
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });
      
      // Navigate and wait for network idle
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout 
      });
      
      // Extract data
      const result = await page.evaluate(() => {
        return {
          html: document.documentElement.outerHTML,
          text: document.body.innerText,
          title: document.title,
          links: Array.from(document.querySelectorAll('a[href]')).map(a => (a as HTMLAnchorElement).href),
scripts: Array.from(document.querySelectorAll('script[src]')).map(s => (s as HTMLScriptElement).src),
          metaTags: Object.fromEntries(
            Array.from(document.querySelectorAll('meta[name], meta[property]'))
              .map(m => [m.getAttribute('name') || m.getAttribute('property'), m.getAttribute('content')])
              .filter(([k, v]) => k && v)
          ),
          hasCookies: !!document.cookie || 
            document.cookie.includes('cookie') ||
            document.documentElement.outerHTML.toLowerCase().includes('cookie'),
          hasAnalytics: document.documentElement.outerHTML.includes('gtag') ||
            document.documentElement.outerHTML.includes('ga-q') ||
            document.documentElement.outerHTML.includes('facebook pixel')
        };
      });
      
      return {
        url,
        ...result,
        loadTime: Date.now() - startTime
      };
      
    } finally {
      await page.close();
    }
  }
  
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance for reuse
let scraperInstance: PlaywrightScraper | null = null;

export function getScraper(): PlaywrightScraper {
  if (!scraperInstance) {
    scraperInstance = new PlaywrightScraper();
  }
  return scraperInstance;
}