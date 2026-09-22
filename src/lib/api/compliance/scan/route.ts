// src/app/api/compliance/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PolicyCrawler } from '@/lib/discovery/crawler';
import { PolicyClassifier } from '@/lib/classifier/policy-classifier';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, options = {} } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let validUrl: string;
    try {
      validUrl = new URL(url).toString();
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`Starting compliance scan for: ${validUrl}`);

    // Step 1: Crawl the website
    const crawler = new PolicyCrawler({
      maxDepth: options.maxDepth ?? 2,
      maxPages: options.maxPages ?? 20,
      delayMs: options.delayMs ?? 500,
      respectRobotsTxt: true,
    });

    const crawlResult = await crawler.crawl(validUrl);
    console.log(`Crawl completed: ${crawlResult.totalPages} pages`);

    // Step 2: Classify discovered pages
    const classifier = new PolicyClassifier({ minConfidence: 0.4 });
    const classifiedPolicies: any[] = [];

    // Note: In production, you'd fetch actual content for each URL
    // For now, we'll return the crawl results with basic classification
    for (const discoveredUrl of crawlResult.discoveredUrls.slice(0, 10)) {
      // You would fetch and classify each page here
      // This is a simplified version
      classifiedPolicies.push({
        url: discoveredUrl.url,
        discoveryMethod: discoveredUrl.source,
        confidence: 0, // Would be calculated by classifier
        policyType: 'unknown',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        crawlResult,
        policies: classifiedPolicies,
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Compliance scan error:', error);
    return NextResponse.json(
      { 
        error: 'Network error. The scraper backend might be asleep or unreachable.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}