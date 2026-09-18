/**
 * POST /api/compliance/quick-scan
 * Scan → applicability → risk, in one call. Anonymous callers allowed with a
 * tight quota, because this is the top-of-funnel demo.
 */
import { route } from '@/lib/api/handler';
import { quickScanRequest } from '@/lib/validation/schemas';
import { consumeQuota } from '@/lib/quota';
import { runScan } from '@/lib/scanner/client';
import { analyzeApplicability } from '@/lib/legalgen/applicability-engine';
import { calculateRiskScore } from '@/lib/legalgen/risk-calculator';
import { convertToBusinessProfile } from '@/lib/legalgen/business-types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = route(
    { schema: quickScanRequest, auth: 'anonymous' },
    async ({ body, user, request, requestId }) => {
        const quota = await consumeQuota(user, request, 'scan');
        const scan = await runScan(body.url, { requestId });

        // Map observed signals to business facts. Unlike the old version this
        // only sets a feature when the scanner reports actual evidence.
        const features: Record<string, boolean> = {};
        const tech = new Set(scan.technologies.map((t) => t.category.toLowerCase()));
        if (tech.has('payments')) features.hasPayments = true;
        if (tech.has('e-commerce')) { features.sellsProducts = true; features.hasPayments = true; }
        if (tech.has('analytics') || tech.has('marketing')) { features.hasCookies = true; features.hasAnalytics = true; }
        if (tech.has('marketing')) features.hasAds = true;
        if (scan.forms.some((f) => f.collectsPersonalData)) features.hasUsers = true;
        if (scan.businessType.key === 'saas') features.hasAccounts = true;

        const profile = convertToBusinessProfile({
            companyName: body.companyName || scan.title || scan.domain,
            website: scan.finalUrl,
            businessType: scan.businessType.key,
            features,
        });

        const applicability = analyzeApplicability(profile);
        const risk = calculateRiskScore(applicability);

        return {
            scan: {
                domain: scan.domain,
                businessType: scan.businessType,
                policies: scan.policies,
                findings: scan.findings.slice(0, 20),
                checksPerformed: scan.checksPerformed,
                checksSkipped: scan.checksSkipped,
                confidence: scan.score.confidence,
            },
            analysis: {
                summary: applicability.summary,
                applicableObligations: applicability.applicableObligations.length,
                needsReview: applicability.needsReviewObligations.length,
                risk: {
                    score: risk.overallScore,
                    level: risk.level,
                    topRisks: risk.topRisks.slice(0, 5),
                },
            },
            recommendations: risk.recommendations.slice(0, 8),
            quota: { remaining: quota.remaining, resetsAt: quota.resetsAt },
            /** Honest framing: signals observed, not a compliance certificate. */
            disclaimer:
                'These are signals observed on the public pages we could reach. They are not a legal opinion or a certificate of compliance.',
        };
    },
);
