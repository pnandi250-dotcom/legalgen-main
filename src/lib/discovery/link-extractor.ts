// src/lib/discovery/link-extractor.ts
import * as cheerio from 'cheerio';
import { LinkExtractionResult } from './types';

export function extractLinks(html: string, baseUrl: string): LinkExtractionResult {
  const $ = cheerio.load(html);
  const links: Array<{ href: string; text: string; context: 'footer' | 'nav' | 'content' | 'sidebar' | 'header' }> = [];
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  const baseOrigin = new URL(baseUrl).origin;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, baseUrl).href;
      const text = $(element).text().trim();
      
      // Determine context
      let context: 'footer' | 'nav' | 'content' | 'sidebar' | 'header' = 'content';
      if ($(element).closest('footer').length > 0) {
        context = 'footer';
      } else if ($(element).closest('nav').length > 0) {
        context = 'nav';
      } else if ($(element).closest('header').length > 0) {
        context = 'header';
      } else if ($(element).closest('aside').length > 0) {
        context = 'sidebar';
      }

      links.push({
        href: absoluteUrl,
        text,
        context
      });

      // Categorize as internal or external
      const linkOrigin = new URL(absoluteUrl).origin;
      if (linkOrigin === baseOrigin) {
        internalLinks.push(absoluteUrl);
      } else {
        externalLinks.push(absoluteUrl);
      }
    } catch {
      // Skip invalid URLs
    }
  });

  return {
    links,
    internalLinks,
    externalLinks
  };
}

export function filterPolicyLinks(links: string[]): string[] {
  const policyKeywords = [
    'privacy', 'policy', 'terms', 'legal', 'cookie',
    'refund', 'return', 'shipping', 'delivery', 'payment',
    'subscription', 'user', 'agreement', 'seller', 'buyer',
    'marketplace', 'acceptable', 'use', 'community', 'guidelines',
    'content', 'intellectual', 'property', 'security', 'data',
    'processing', 'retention', 'deletion', 'consent', 'children',
    'accessibility', 'grievance', 'complaints', 'consumer',
    'advertising', 'marketing', 'affiliate', 'partner', 'vendor',
    'employment', 'gdpr', 'ccpa', 'dpdp', 'lgpd', 'pipeda'
  ];

  return links.filter(link => {
    const lowerLink = link.toLowerCase();
    return policyKeywords.some(keyword => lowerLink.includes(keyword));
  });
}

export function deduplicateLinks(links: string[]): string[] {
  const seen = new Set<string>();
  return links.filter(link => {
    const normalized = link.toLowerCase().replace(/\/$/, '');
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = ''; // Remove hash
    return parsed.toString();
  } catch {
    return url;
  }
}

export class LinkExtractor {
  extract(html: string, baseUrl: string): LinkExtractionResult {
    return extractLinks(html, baseUrl);
  }
}