import { RobotsTxtResult } from './types';

export class RobotsTxtParser {
  async parse(baseUrl: string): Promise<RobotsTxtResult> {
    const robotsUrl = `${baseUrl}/robots.txt`;
    
    try {
      const response = await fetch(robotsUrl, { method: 'GET' });
      
      if (!response.ok) {
        return {
          allowedPaths: [],
          disallowedPaths: [],
          sitemaps: [],
          crawlDelay: undefined
        };
      }

      const text = await response.text();
      return this.parseContent(text);
    } catch (error) {
      console.error(`Error parsing robots.txt:`, error);
      return {
        allowedPaths: [],
        disallowedPaths: [],
        sitemaps: [],
        crawlDelay: undefined
      };
    }
  }

  private parseContent(content: string): RobotsTxtResult {
    const allowedPaths: string[] = [];
    const disallowedPaths: string[] = [];
    const sitemaps: string[] = [];
    let crawlDelay: number | undefined;

    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Allow:')) {
        allowedPaths.push(trimmed.substring(6).trim());
      } else if (trimmed.startsWith('Disallow:')) {
        disallowedPaths.push(trimmed.substring(9).trim());
      } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
        sitemaps.push(trimmed.substring(8).trim());
      } else if (trimmed.toLowerCase().startsWith('crawl-delay:')) {
        const delay = parseFloat(trimmed.substring(12).trim());
        if (!isNaN(delay)) {
          crawlDelay = delay;
        }
      }
    }

    // Fixed: Removed 'robotsUrl' property which doesn't exist in RobotsTxtResult
    return {
      allowedPaths,
      disallowedPaths,
      sitemaps,
      crawlDelay
    };
  }
}