export type FeatureKey =
    | 'hasLogin'
    | 'hasPayments'
    | 'hasSubscriptions'
    | 'shipsPhysicalGoods'
    | 'hasBookingSystem'
    | 'hasUserGeneratedContent'
    | 'hasAiFeatures'
    | 'hasCookiesAnalytics'
    | 'hasNewsletter'
    | 'hasInternationalUsers'
    | 'collectsChildrenData'
    | 'hasFileUploads'
    | 'hasReviews';

export type FeatureMap = Record<FeatureKey, boolean>;

export interface RequiredDocument {
    documentType: string;
    severity: 'required' | 'recommended';
    reason: string;
}

export interface ClauseDefinition {
    id: string;
    purpose: string;
    triggerFeatures: FeatureKey[];
    supportedIndustries: string[];
    documentTypes: string[];
    render: (data: Record<string, unknown>) => string;
}