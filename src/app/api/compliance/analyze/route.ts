// src/app/api/compliance/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PolicyCrawler } from '@/lib/discovery/crawler';
import { PolicyClassifier } from '@/lib/classifier/policy-classifier';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Crawl the website
    const crawler = new PolicyCrawler({
      maxDepth: 2,
      maxPages: 15,
      delayMs: 500,
      respectRobotsTxt: true
    });

    const crawlResult = await crawler.crawl(url);

    // 2. Classify policies (simplified for API response)
    const classifier = new PolicyClassifier({ minConfidence: 0.4 });
    const identifiedPolicies: any[] = [];

    // Note: In a real scenario, you would fetch content for each crawled URL here.
    // For now, we return the crawl structure which the frontend can analyze.
    
    return NextResponse.json({
      success: true,
      url,
      crawlResult: {
        totalPages: crawlResult.totalPages,
        discoveredUrls: crawlResult.discoveredUrls.map(u => ({
          url: u.url,
          source: u.source,
          depth: u.depth
        }))
      },
      message: `Successfully crawled ${crawlResult.totalPages} pages.`
    });

  } catch (error) {
    console.error('Compliance analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website. ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}