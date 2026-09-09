// src/lib/legal-engine/compliance-report.ts
import type { FeatureMap } from './types';
import { getRequiredDocuments } from './rule-engine';

export interface RiskItem {
    id: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    relatedDocument: string;
}

export interface ComplianceReport {
    requiredDocuments: ReturnType<typeof getRequiredDocuments>;
    risks: RiskItem[];
    score: number; // 0-100, based on how many required docs the business has actually generated
}

const RISK_RULES: { when: (f: FeatureMap) => boolean; risk: RiskItem }[] = [
    {
        when: (f) => f.hasPayments && !f.hasCookiesAnalytics,
        risk: { id: 'payment-no-tracking-disclosure', severity: 'medium', message: 'You accept payments but have not disclosed any tracking/analytics — verify no payment-related cookies are used without disclosure.', relatedDocument: 'cookie-policy' },
    },
    {
        when: (f) => f.hasUserGeneratedContent && !f.hasLogin,
        risk: { id: 'ugc-no-accountability', severity: 'high', message: 'Users can post content without any account system — this makes abuse and takedown enforcement significantly harder, and weakens your Section 79 safe-harbour position.', relatedDocument: 'acceptable-use-policy' },
    },
    {
        when: (f) => f.collectsChildrenData,
        risk: { id: 'children-data-high-risk', severity: 'high', message: 'You collect data from users under 18 — this requires verifiable parental consent under the DPDP Act, 2023, a stricter standard than general data collection.', relatedDocument: 'privacy-policy' },
    },
    {
        when: (f) => f.hasInternationalUsers && !f.hasCookiesAnalytics,
        risk: { id: 'international-no-gdpr-prep', severity: 'medium', message: 'You have international users but have not confirmed cookie/tracking practices — this affects GDPR compliance obligations.', relatedDocument: 'gdpr-compliance' },
    },
    {
        when: (f) => f.hasSubscriptions,
        risk: { id: 'subscription-cancellation-clarity', severity: 'medium', message: 'Recurring billing requires a clear, easy cancellation mechanism — ensure your Cancellation Policy explicitly covers this to avoid Consumer Protection Act "dark pattern" concerns.', relatedDocument: 'cancellation-policy' },
    },
];

export function generateComplianceReport(features: FeatureMap, generatedDocTypes: string[]): ComplianceReport {
    const requiredDocuments = getRequiredDocuments(features);
    const risks = RISK_RULES.filter((r) => r.when(features)).map((r) => r.risk);

    const requiredCount = requiredDocuments.filter((d) => d.severity === 'required').length;
    const generatedRequiredCount = requiredDocuments.filter(
        (d) => d.severity === 'required' && generatedDocTypes.includes(d.documentType)
    ).length;

    const score = requiredCount === 0 ? 100 : Math.round((generatedRequiredCount / requiredCount) * 100);

    return { requiredDocuments, risks, score };
}