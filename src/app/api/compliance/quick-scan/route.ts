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

/**
 * Compliance feature flags implied by one scanner technology category.
 *
 * The scanner's `TECHNOLOGY_SIGNATURES` categories are a fixed contract
 * (`Payment`, `Analytics`, `Advertising`, `Email/CRM`, `Chat/Support`,
 * `Auth`). This table is the single translation point from that vocabulary to
 * the flags `convertToBusinessProfile` reads, so the two can never drift
 * apart again the way a bare `tech.has('payments')` check did.
 *
 * `Chat/Support` is deliberately absent: a support widget (Intercom, Crisp,
 * Tawk.to) implies no compliance-critical fact on its own.
 */
const CATEGORY_FEATURES: Record<string, string[]> = {
    payment: ['hasPayments'],
    advertising: ['hasAds'],
    analytics: ['hasAnalytics', 'hasCookies'],
    // Email/CRM is a marketing signal, not advertising: it feeds
    // hasMarketingEmails downstream, and must never imply hasAds.
    email: ['hasNewsletter'],
    crm: ['hasNewsletter'],
    // An auth provider means the site has user accounts. It does not imply
    // hasUsers — that flag means "collects personal data" and stays reserved
    // for real form evidence.
    auth: ['hasAccounts'],
    // Legacy vocabulary, kept so an older or alternate source that still
    // emits these strings keeps working. `ecommerce` keeps implying payments
    // (a shop takes payments); `marketing` keeps its original meaning of
    // advertising plus tracking.
    payments: ['hasPayments'],
    ecommerce: ['sellsProducts', 'hasPayments'],
    marketing: ['hasAds', 'hasAnalytics', 'hasCookies'],
};

const CATEGORY_ALIASES = Object.keys(CATEGORY_FEATURES);

/**
 * Case-, whitespace- and separator-insensitive category key. Drops every
 * non-alphanumeric run so `Email/CRM`, `email/crm`, ` email/crm ` and
 * `e-commerce` all collapse to a form the alias table can match.
 */
const categoryKey = (category: string): string =>
    category.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Every feature flag implied by the given technology categories. */
const featureFlagsForCategories = (categories: string[]): string[] => {
    const flags = new Set<string>();
    for (const category of categories) {
        const key = categoryKey(category);
        if (!key) continue;
        for (const alias of CATEGORY_ALIASES) {
            if (!key.includes(alias)) continue;
            for (const flag of CATEGORY_FEATURES[alias]) flags.add(flag);
        }
    }
    return [...flags];
};

export const POST = route(
    { schema: quickScanRequest, auth: 'anonymous' },
    async ({ body, user, request, requestId }) => {
        const quota = await consumeQuota(user, request, 'scan');
        const scan = await runScan(body.url, { requestId });

        // Map observed signals to business facts. Unlike the old version this
        // only sets a feature when the scanner reports actual evidence.
        const features: Record<string, boolean> = {};
        const techCategories = scan.technologies.map((t) => t.category);
        for (const flag of featureFlagsForCategories(techCategories)) features[flag] = true;
        // No scanner technology category means "sells products": commerce is
        // detected from page content and surfaces as the business type instead.
        // Payment alone is not enough — a SaaS plan checkout takes payments
        // without selling goods.
        if (scan.businessType.key === 'ecommerce') features.sellsProducts = true;
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
