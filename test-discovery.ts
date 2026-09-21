import { PolicyCrawler } from './src/lib/discovery/crawler';

async function runTest(targetUrl?: string) {
  const url = targetUrl || 'https://example.com';
  
  console.log('🚀 Starting Discovery Engine Test\n');
  console.log(`Crawling: ${url}\n`);

  try {
    const crawler = new PolicyCrawler({
      maxDepth: 2,
      maxPages: 20,
      delayMs: 500,
      respectRobotsTxt: true,
      sameOriginOnly: true
    });

    const result = await crawler.crawl(url);

    console.log('\n✅ Crawl Complete!\n');
    console.log('📊 Results:');
    console.log(`   Base URL: ${result.baseUrl}`);
    console.log(`   Total Pages: ${result.totalPages}`);
    console.log(`   Discovered URLs: ${result.discoveredUrls.length}`);
    console.log(`   Errors: ${result.errors.length}`);
    console.log(`   robots.txt Found: ${result.robotsTxtFound}`);
    console.log(`   Sitemap Found: ${result.sitemapFound}`);
    console.log(`   Crawl Time: ${result.crawlTime.toFixed(2)}s\n`);

    if (result.discoveredUrls.length > 0) {
      console.log('📋 Sample Discovered URLs:');
      result.discoveredUrls.slice(0, 10).forEach((url, index) => {
        console.log(`   ${index + 1}. ${url.url} [${url.source}] (depth: ${url.depth})`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.url}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Test Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Get URL from command line arguments
const targetUrl = process.argv[2];
runTest(targetUrl);