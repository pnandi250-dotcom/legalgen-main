import { NextRequest, NextResponse } from 'next/server';
import { getScraper } from '@/lib/legal-engine/playwright-scraper';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    const scraper = getScraper();
    const result = await scraper.scrapeWebsite(url);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape website' },
      { status: 500 }
    );
  }
}