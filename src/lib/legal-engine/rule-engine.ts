import type { FeatureMap, RequiredDocument } from './types';

interface Rule {
    when: (f: FeatureMap) => boolean;
    require: RequiredDocument[];
}

const RULES: Rule[] = [
    {
        when: (f) => f.hasLogin,
        require: [
            { documentType: 'privacy-policy', severity: 'required', reason: 'User accounts collect personal data.' },
            { documentType: 'terms-of-service', severity: 'required', reason: 'Account creation requires binding terms.' },
        ],
    },
    {
        when: (f) => f.hasPayments,
        require: [
            { documentType: 'refund-policy', severity: 'required', reason: 'Payments require a refund policy under Consumer Protection Rules.' },
        ],
    },
    {
        when: (f) => f.shipsPhysicalGoods,
        require: [
            { documentType: 'shipping-policy', severity: 'required', reason: 'Physical goods require delivery terms.' },
            { documentType: 'return-policy', severity: 'recommended', reason: 'Physical goods commonly need a return process.' },
        ],
    },
    {
        when: (f) => f.hasBookingSystem,
        require: [
            { documentType: 'cancellation-policy', severity: 'required', reason: 'Bookings need cancellation and no-show terms.' },
        ],
    },
    {
        when: (f) => f.hasUserGeneratedContent,
        require: [
            { documentType: 'acceptable-use-policy', severity: 'required', reason: 'UGC platforms need conduct rules.' },
            { documentType: 'community-guidelines', severity: 'recommended', reason: 'UGC platforms benefit from published standards.' },
        ],
    },
    {
        when: (f) => f.hasCookiesAnalytics,
        require: [
            { documentType: 'cookie-policy', severity: 'recommended', reason: 'Analytics/tracking should be disclosed.' },
        ],
    },
    {
        when: (f) => f.hasInternationalUsers,
        require: [
            { documentType: 'gdpr-compliance', severity: 'recommended', reason: 'International users may fall under GDPR.' },
        ],
    },
];

export function getRequiredDocuments(features: FeatureMap): RequiredDocument[] {
    const seen = new Map<string, RequiredDocument>();
    for (const rule of RULES) {
        if (!rule.when(features)) continue;
        for (const req of rule.require) {
            const existing = seen.get(req.documentType);
            if (!existing || (existing.severity === 'recommended' && req.severity === 'required')) {
                seen.set(req.documentType, req);
            }
        }
    }
    return Array.from(seen.values());
}