// src/lib/discovery/types.ts

export type DiscoveryMethod = 
  | 'sitemap' 
  | 'robots-txt' 
  | 'footer-link' 
  | 'nav-link' 
  | 'internal-link' 
  | 'structured-data'
  | 'seed';

export interface DiscoveredUrl {
  url: string;
  source: DiscoveryMethod;
  depth: number;
  context?: string;
  crawled?: boolean;
  httpStatus?: number;
  contentType?: string;
  policyConfidence?: number;
}

export interface RobotsTxtResult {
  allowedPaths: string[];
  disallowedPaths: string[];
  sitemaps: string[];
  crawlDelay?: number;
}

export interface SitemapResult {
  urls: string[];
  sitemapIndexes: string[];
  lastModified?: Record<string, string>;
}

export interface LinkExtractionResult {
  links: Array<{
    href: string;
    text: string;
    context: 'footer' | 'nav' | 'content' | 'sidebar' | 'header';
  }>;
  internalLinks: string[];
  externalLinks: string[];
}

export interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
  respectRobotsTxt?: boolean;
  delayMs?: number;
  allowedDomains?: string[];
  excludedPatterns?: RegExp[];
  sameOriginOnly?: boolean;
  timeout?: number;
  userAgent?: string;
}

export interface RequiredCrawlOptions extends Required<CrawlOptions> {
  delayMs: number;
  sameOriginOnly: boolean;
  timeout: number;
  userAgent: string;
}

export interface CrawlResult {
  baseUrl: string;
  discoveredUrls: DiscoveredUrl[];
  totalPages: number;
  errors: Array<{ url: string; error: string }>;
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  crawlTime: number;
}

// Updated to match classifier expectations
export interface PageContent {
  url: string;
  title: string;
  textContent: string; // Changed from 'text' to 'textContent'
  headings: string[];
  metaDescription?: string;
  metaKeywords?: string;
  // Changed from string[] to object array
  links: Array<{ href: string; text: string }>; 
  navigationContext?: string;
  html?: string;
  language?: string;
}

export interface CrawledPage extends PageContent {
  statusCode: number;
  discoveryMethod: DiscoveryMethod;
}

export interface CrawlStats {
  totalDiscovered: number;
  totalCrawled: number;
  totalErrors: number;
  policiesFound: number;
  startTime: number;
  endTime?: number;
}