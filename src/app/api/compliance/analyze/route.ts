/**
 * POST /api/compliance/analyze
 *
 * Delegates to the external scanner service for consistent results.
 * Replaces the old implementation which had duplicate business logic and
 * Playwright dependency that doesn't work on Vercel.
 */
import { route } from '@/lib/api/handler';
import { quickScanRequest } from '@/lib/validation/schemas';
import { consumeQuota } from '@/lib/quota';
import { runScan } from '@/lib/scanner/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = route(
  { schema: quickScanRequest, auth: 'anonymous' },
  async ({ body, user, request, requestId, log }) => {
    await consumeQuota(user, request, 'scan');

    log('analyze_start', { url: body.url });
    const scan = await runScan(body.url, { requestId });

    // Map scanner results to the analyze response format
    const businessType = scan.businessType;
    const policies = scan.policies;
    const findings = scan.findings;

    // Determine found/missing pages from scanner results
    const foundPages = policies
      .filter(p => p.found && p.substantive)
      .map(p => ({ name: p.expected, url: p.url }));

    const missingPages = policies
      .filter(p => !p.found || !p.substantive)
      .map(p => p.expected);

    const score = scan.score.value;

    // Build compliance results in the expected format
    const complianceResults = policies.map(p => ({
      type: p.expected.toLowerCase().replace(/\s+/g, '-'),
      label: p.expected,
      page: p.expected,
      found: p.found && p.substantive,
      url: (p.found && p.substantive && p.url) || null,
      source: p.found ? 'Detected' : '',
      severity: ['Privacy Policy', 'Terms of Service'].includes(p.expected) ? 'critical' : 'important',
      description: `Required for ${businessType.name}`,
      generateType: p.expected.toLowerCase().replace(/\s+/g, '-'),
    }));

    log('analyze_done', { domain: scan.domain, score, findings: findings.length });

    return {
      success: true,
      text: '', // Scanner doesn't return full text
      data: {
        url: scan.finalUrl,
        businessType: businessType.name,
        score,
        foundPages,
        missingPages,
        results: complianceResults,
        // Additional scanner data
        scanner: {
          domain: scan.domain,
          title: scan.title,
          technologies: scan.technologies,
          forms: scan.forms,
          riskLevel: scan.riskLevel,
          checksPerformed: scan.checksPerformed,
          checksSkipped: scan.checksSkipped,
          confidence: scan.score.confidence,
        },
      },
      disclaimer: 'Analysis performed by automated scanner. Not a legal opinion or compliance certificate.',
    };
  }
);