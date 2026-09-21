// test-discovery-v2.ts
import { PolicyCrawler } from './src/lib/discovery/crawler';
import { PolicyClassifier } from './src/lib/classifier/policy-classifier';
import { PageContent } from './src/lib/discovery/types';
import * as cheerio from 'cheerio';

async function runAdvancedTest(targetUrl: string) {
  console.log('🚀 Starting Advanced Discovery Engine Test\n');
  console.log(`Target: ${targetUrl}\n`);

  // Step 1: Crawl the website
  console.log('📡 Step 1: Crawling website...');
  const crawler = new PolicyCrawler({
    maxDepth: 2,
    maxPages: 20,
    delayMs: 500,
    respectRobotsTxt: true
  });

  const crawlResult = await crawler.crawl(targetUrl);
  console.log(`✅ Crawl Complete: ${crawlResult.totalPages} pages, ${crawlResult.discoveredUrls.length} URLs\n`);

  // Step 2: Classify discovered pages
  console.log('🔍 Step 2: Classifying policies...\n');
  const classifier = new PolicyClassifier({ minConfidence: 0.4 });

  const discoveredPolicies: Array<{
    url: string;
    classification: any;
  }> = [];

  // Simulate page content extraction
  for (const urlInfo of crawlResult.discoveredUrls.slice(0, 10)) {
    try {
      // Fetch page content
      const response = await fetch(urlInfo.url, {
        headers: { 'User-Agent': 'LegalGenBot/1.0' }
      });

      if (!response.ok) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract links properly as objects
      const linkElements = $('a[href]');
      const links = linkElements.map((_, el) => ({
        href: $(el).attr('href') || '',
        text: $(el).text().trim()
      })).get();

      // Extract page content matching the unified PageContent interface
      const pageContent: PageContent = {
        url: urlInfo.url,
        title: $('title').text() || 'Untitled',
        textContent: $('body').text().substring(0, 5000), // Use textContent
        headings: $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().slice(0, 10),
        metaDescription: $('meta[name="description"]').attr('content') || '',
        metaKeywords: $('meta[name="keywords"]').attr('content') || '',
        links: links, // Pass object array
        navigationContext: undefined,
        html: html.substring(0, 10000),
        language: $('html').attr('lang') || 'en'
      };

      // Classify the page (returns single ClassificationResult, not array)
      const classification = classifier.classify(pageContent, urlInfo.source);

      // Only record if confidence is above threshold
      if (classification.confidence >= 0.4 && classification.policyType !== 'unknown') {
        discoveredPolicies.push({
          url: urlInfo.url,
          classification
        });

        console.log(`   📄 ${classification.policyType.toUpperCase()}`);
        console.log(`      URL: ${urlInfo.url}`);
        console.log(`      Confidence: ${(classification.confidence * 100).toFixed(1)}% (${classification.level})`);
        console.log(`      Category: ${classification.evidence.length > 0 ? 'Detected' : 'Unknown'}`);
        if (classification.evidence.length > 0) {
        }
        console.log('');
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not process ${urlInfo.url}: ${error}`);
    }
  }

  // Step 3: Summary
  console.log('📊 SUMMARY\n');
  console.log(`   Total Pages Crawled: ${crawlResult.totalPages}`);
  console.log(`   Total URLs Discovered: ${crawlResult.discoveredUrls.length}`);
  console.log(`   Policies Identified: ${discoveredPolicies.length}`);
  console.log(`   Errors: ${crawlResult.errors.length}`);
  console.log(`   Crawl Time: ${(crawlResult.crawlTime / 1000).toFixed(2)}s\n`);

  if (discoveredPolicies.length > 0) {
    console.log('🏷️  IDENTIFIED POLICIES:\n');
    discoveredPolicies.forEach((policy, idx) => {
      const c = policy.classification;
      console.log(`   ${idx + 1}. ${c.policyType}`);
      console.log(`      URL: ${policy.url}`);
      console.log(`      Confidence: ${(c.confidence * 100).toFixed(1)}%`);
      console.log('');
    });
  }

  // Export audit trail
  const auditJson = classifier.exportAuditTrail();
  const trail = classifier.getAuditTrail();
  console.log('💾 Audit trail exported (JSON format)');
  console.log(`   Records: ${trail.length}\n`);

  return {
    crawlResult,
    discoveredPolicies,
    auditTrail: trail
  };
}

// Run test
const targetUrl = process.argv[2] || 'https://www.zerodha.com';
runAdvancedTest(targetUrl)
  .then(() => {
    console.log('✅ Test completed successfully!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });