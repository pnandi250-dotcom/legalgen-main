/**
 * POST /api/compliance/scan
 *
 * Rewritten: authenticated, quota-metered, domain-ownership aware, persisted.
 * Was: unauthenticated, unmetered, unsaved, and calling the scanner with a
 * key name the scanner never read (F-02, F-05, F-06, P1-02).
 */
import { route } from '@/lib/api/handler';
import { scanRequest } from '@/lib/validation/schemas';
import { consumeQuota } from '@/lib/quota';
import { runScan } from '@/lib/scanner/client';
import { saveScan } from '@/lib/data/scans';
import { isDomainVerified, normaliseDomain } from '@/lib/domains/verification';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = route({ schema: scanRequest }, async ({ body, user, request, requestId, log }) => {
    await consumeQuota(user, request, 'scan');

    const domain = normaliseDomain(body.url);
    const domainVerified = await isDomainVerified(user.uid, domain);

    log('scan_start', { domain, domainVerified });
    const result = await runScan(body.url, { requestId });

    const scanId = body.save ? await saveScan(user, result, { domainVerified }) : null;
    log('scan_done', { domain, score: result.score.value, findings: result.findings.length });

    return {
        scanId,
        domainVerified,
        /**
         * Unverified domains get findings but no headline grade: an audit of
         * someone else's site is a preview, not a verdict you can publish.
         */
        result: domainVerified ? result : { ...result, score: { ...result.score, grade: 'preview' } },
    };
});
