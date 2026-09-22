// src/app/api/compliance/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PolicyCrawler } from '@/lib/discovery/crawler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl = body.url || body.targetUrl;

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Initialize crawler with safe defaults for serverless
    const crawler = new PolicyCrawler({
      maxDepth: 1,       // Shallow crawl for speed
      maxPages: 5,       // Limit pages to avoid timeout
      delayMs: 500,      // Polite delay
      respectRobotsTxt: true,
      timeout: 15000,    // 15s timeout per page
      userAgent: 'LegalGenBot/1.0 (+https://yourdomain.com/bot)'
    });

    console.log(`Starting crawl for: ${targetUrl}`);
    
    // Run crawl
    const result = await crawler.crawl(targetUrl);
    
    // Combine all text content from crawled pages
    let fullText = '';
    // Note: Since our current crawler returns DiscoveredUrl, we need to fetch content again 
    // OR modify the crawler to return content. 
    // For now, let's fetch the main URL content directly as a fallback:
    
    const mainRes = await fetch(targetUrl, {
      headers: { 'User-Agent': 'LegalGenBot/1.0' }
    });
    
    if (mainRes.ok) {
      const html = await mainRes.text();
      // Simple text extraction (remove tags)
      fullText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (!fullText) {
      return NextResponse.json({ error: 'Could not retrieve website content' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      text: fullText,
      url: targetUrl,
      pagesCrawled: result.totalPages
    });

  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Crawl failed' },
      { status: 500 }
    );
  }
}