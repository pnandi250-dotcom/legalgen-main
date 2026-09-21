import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as https from 'https';
import { 
  DiscoveredUrl, 
  CrawlOptions, 
  CrawlResult, 
  PageContent, 
  DiscoveryMethod 
} from './types';
import { RobotsTxtParser } from './robots-parser';
import { SitemapParser } from './sitemap-parser';
import { LinkExtractor } from './link-extractor';

// Helper function for legacy SSL support (optional, used if needed)
function createUnsafeAgent(): https.Agent {
  return new https.Agent({
    rejectUnauthorized: false,
    secureOptions: require('constants').SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
  });
}

export class PolicyCrawler {
  private options: Required<CrawlOptions>;
  private visitedUrls = new Set<string>();
  private queue: DiscoveredUrl[] = [];
  private results: DiscoveredUrl[] = [];
  private errors: Array<{ url: string; error: string }> = [];
  private robotsParser = new RobotsTxtParser();
  private sitemapParser = new SitemapParser();
  private linkExtractor = new LinkExtractor();

  constructor(options: CrawlOptions) {
    this.options = {
      maxDepth: options.maxDepth ?? 3,
      maxPages: options.maxPages ?? 50,
      respectRobotsTxt: options.respectRobotsTxt ?? true,
      delayMs: options.delayMs ?? 1000,
      allowedDomains: options.allowedDomains ?? [],
      excludedPatterns: options.excludedPatterns ?? [],
      sameOriginOnly: options.sameOriginOnly ?? true,
      timeout: options.timeout ?? 30000,
      userAgent: options.userAgent ?? 'LegalGenBot/1.0 (+https://example.com/bot)',
    };
  }

  public async crawl(baseUrl: string): Promise<CrawlResult> {
    const startTime = Date.now();
    const baseDomain = new URL(baseUrl).hostname;
    
    // Initialize queue
    this.queue.push({
      url: baseUrl,
      source: 'seed',
      depth: 0
    });

    // Check robots.txt
    let robotsTxtFound = false;
    let allowedPaths: string[] = [];
    let disallowedPaths: string[] = [];

    if (this.options.respectRobotsTxt) {
      try {
        const robotsResult = await this.robotsParser.parse(baseUrl);
        robotsTxtFound = true;
        allowedPaths = robotsResult.allowedPaths;
        disallowedPaths = robotsResult.disallowedPaths;
        
        // Add sitemaps to queue for parsing
        for (const sitemapUrl of robotsResult.sitemaps) {
          this.queue.push({
            url: sitemapUrl,
            source: 'robots-txt',
            depth: 0,
            context: 'sitemap-reference'
          });
        }
      } catch (error) {
        console.warn(`Failed to parse robots.txt: ${error}`);
      }
    }

    // Check for sitemap directly
    let sitemapFound = false;
    try {
      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      const sitemapResult = await this.sitemapParser.parse(sitemapUrl);
      if (sitemapResult.urls.length > 0) {
        sitemapFound = true;
        for (const url of sitemapResult.urls) {
          if (!this.visitedUrls.has(url)) {
            this.queue.push({
              url,
              source: 'sitemap',
              depth: 1,
              context: 'sitemap-discovery'
            });
          }
        }
      }
    } catch (error) {
      // Sitemap not found is normal
    }

    // Process queue
    while (this.queue.length > 0 && this.results.length < this.options.maxPages) {
      const current = this.queue.shift()!;
      
      if (this.visitedUrls.has(current.url)) {
        continue;
      }

      // Check depth limit
      if (current.depth > this.options.maxDepth) {
        continue;
      }

      // Check robots.txt restrictions
      if (this.options.respectRobotsTxt && !this.isAllowedByRobots(current.url, allowedPaths, disallowedPaths)) {
        continue;
      }

      // Check domain restrictions
      if (this.options.sameOriginOnly) {
        try {
          const urlObj = new URL(current.url);
          if (urlObj.hostname !== baseDomain) {
            continue;
          }
        } catch {
          continue;
        }
      }

      this.visitedUrls.add(current.url);

      try {
        await this.delay(this.options.delayMs);
        const pageContent = await this.fetchPage(current.url);
        
        if (pageContent) {
          const discoveredUrl: DiscoveredUrl = {
            ...current,
            crawled: true,
            httpStatus: 200,
            contentType: 'text/html',
            policyConfidence: 0 // Will be calculated by classifier later
          };
          
          this.results.push(discoveredUrl);

          // Extract links if within depth limit AND html exists
          if (current.depth < this.options.maxDepth && pageContent.html) {
            const links = this.linkExtractor.extract(pageContent.html, current.url);
            
            for (const link of links.internalLinks) {
              if (!this.visitedUrls.has(link) && !this.isExcluded(link)) {
                this.queue.push({
                  url: link,
                  source: 'internal-link',
                  depth: current.depth + 1,
                  context: 'body-link'
                });
              }
            }
          }
        }
      } catch (error) {
        this.errors.push({
          url: current.url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        this.results.push({
          ...current,
          crawled: false,
          httpStatus: 0,
          contentType: undefined
        });
      }
    }

    return {
      baseUrl,
      discoveredUrls: this.results,
      totalPages: this.results.filter(r => r.crawled).length,
      errors: this.errors,
      robotsTxtFound,
      sitemapFound,
      crawlTime: Date.now() - startTime
    };
  }

  private async fetchPage(url: string): Promise<PageContent | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract text content
      $('script, style, noscript').remove();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();

      // Extract headings
      const headings: string[] = [];
      $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const headingText = $(el).text().trim();
        if (headingText) headings.push(headingText);
      });

      // Extract meta tags
      const metaTags: Record<string, string> = {};
      $('meta[name], meta[property]').each((_, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
          metaTags[name] = content;
        }
      });

      // Extract title
      const title = $('title').text().trim() || metaTags['og:title'] || '';

      // Extract language
      const language = $('html').attr('lang') || 'en';

      // Extract last modified from meta or header
      const lastModified = metaTags['last-modified'] || response.headers.get('last-modified') || undefined;

      // FIX: Extract links as objects { href, text } to match PageContent interface
      const links: Array<{ href: string; text: string }> = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href) {
          links.push({ href, text });
        }
      });

      return {
        url,
        title,
        textContent,
        html,
        headings,
        links, // Now correctly typed as { href: string; text: string }[]
        language,
      };
    } catch (error) {
      throw error;
    }
  }

  private isAllowedByRobots(url: string, allowed: string[], disallowed: string[]): boolean {
    const pathname = new URL(url).pathname;
    
    // Check disallowed first
    for (const pattern of disallowed) {
      if (pathname.startsWith(pattern)) {
        return false;
      }
    }

    // If allowed list exists, must match one
    if (allowed.length > 0) {
      return allowed.some(pattern => pathname.startsWith(pattern));
    }

    return true;
  }

  private isExcluded(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Exclude common non-policy patterns
      const excludePatterns = [
        /\.pdf$/i,
        /\.docx?$/i,
        /\.xlsx?$/i,
        /\.pptx?$/i,
        /\.zip$/i,
        /\.exe$/i,
        /\/login/i,
        /\/logout/i,
        /\/admin/i,
        /\/dashboard/i,
        /\/account\/settings/i,
        /\/cart/i,
        /\/checkout/i,
        /\/search\?/i,
        /\/\?/i,
      ];

      for (const pattern of excludePatterns) {
        if (pattern.test(urlObj.pathname + urlObj.search)) {
          return true;
        }
      }

      // Check custom excluded patterns
      for (const pattern of this.options.excludedPatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }

      return false;
    } catch {
      return true; // Invalid URLs are excluded
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async exportResults(results: CrawlResult, outputDir: string): Promise<string> {
    await fs.mkdir(outputDir, { recursive: true });
    const filename = `crawl-results-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2), 'utf-8');
    return filepath;
  }
}