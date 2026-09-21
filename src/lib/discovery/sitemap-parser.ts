import { SitemapResult } from './types';

export class SitemapParser {
  async parse(url: string): Promise<SitemapResult> {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        return { urls: [], sitemapIndexes: [] };
      }

      const text = await response.text();
      return this.parseContent(text, url);
    } catch (error) {
      console.error(`Error parsing sitemap ${url}:`, error);
      return { urls: [], sitemapIndexes: [] };
    }
  }

  private parseContent(content: string, baseUrl: string): SitemapResult {
    const urls: string[] = [];
    const sitemapIndexes: string[] = [];
    const lastModified: Record<string, string> = {}; // Fixed: Use Record

    // Remove XML namespaces for easier parsing
    const cleanXml = content.replace(/xmlns[^"]*=""|xmlns[^"]*="[^"]*"/g, '');

    // Check if it's a sitemap index
    const isIndex = cleanXml.includes('<sitemapindex');

    if (isIndex) {
      // Parse sitemap indexes
      const sitemapMatches = cleanXml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g);
      for (const match of sitemapMatches) {
        sitemapIndexes.push(match[1].trim());
      }
      
      // Extract lastmod if present
      const sitemapBlocks = content.split('</sitemap>');
      for (const block of sitemapBlocks) {
        const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
        const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
        if (locMatch && lastmodMatch) {
          lastModified[locMatch[1].trim()] = lastmodMatch[1].trim();
        }
      }
    } else {
      // Parse URL set
      const urlMatches = cleanXml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g);
      for (const match of urlMatches) {
        urls.push(match[1].trim());
      }

      // Extract lastmod for each URL
      const urlBlocks = content.split('</url>');
      for (const block of urlBlocks) {
        const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
        const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
        if (locMatch && lastmodMatch) {
          lastModified[locMatch[1].trim()] = lastmodMatch[1].trim();
        }
      }
    }

    return {
      urls,
      sitemapIndexes,
      lastModified: Object.keys(lastModified).length > 0 ? lastModified : undefined
    };
  }
}