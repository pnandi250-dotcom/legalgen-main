/**
 * LegalGen V2 - Applicability Engine
 * 
 * Determines which regulations apply to a business using 5-state logic:
 * APPLIES | DOES_NOT_APPLY | POTENTIALLY_APPLIES | NEEDS_REVIEW | UNKNOWN
 */

import {
    BusinessProfile,
    DataProcessing,
    TechnologyDetection
} from './business-types';

import {
    Regulation,
    Obligation,
    ApplicabilityStatus,
    INDIAN_REGULATIONS,
    SAMPLE_OBLIGATIONS
} from './regulatory-types';

/**
 * Result of applicability check for a single obligation
 */
export interface ApplicabilityResult {
    obligationId: string;
    status: ApplicabilityStatus;
    confidence: number; // 0-1
    reasons: string[];
    requiresManualReview: boolean;
}

/**
 * Result of full applicability analysis
 */
export interface ApplicabilityAnalysis {
    businessProfile: BusinessProfile;
    results: ApplicabilityResult[];
    applicableObligations: Obligation[];
    potentiallyApplicableObligations: Obligation[];
    needsReviewObligations: Obligation[];
    summary: {
        totalChecked: number;
        applies: number;
        doesNotApply: number;
        potentiallyApplies: number;
        needsReview: number;
        unknown: number;
    };
}

/**
 * Rule for determining applicability
 */
interface ApplicabilityRule {
    obligationId: string;
    check: (profile: BusinessProfile) => ApplicabilityStatus;
    confidence: (profile: BusinessProfile) => number;
    reason: (profile: BusinessProfile) => string;
}

// ============================================================================
// DPDP Act Rules
// ============================================================================

const dpdpRules: ApplicabilityRule[] = [
    // Section 6: Processing personal data
    {
        obligationId: 'dpdp-sec6-processing',
        check: (p) => {
            if (!p.dataProcessing.collectsPersonalData) return 'DOES_NOT_APPLY';
            if (p.isDataFiduciary) return 'APPLIES';
            return 'POTENTIALLY_APPLIES';
        },
        confidence: (p) => p.dataProcessing.collectsPersonalData ? 0.95 : 1.0,
        reason: (p) => p.dataProcessing.collectsPersonalData
            ? `Collects personal data: ${p.dataProcessing.dataCategories.join(', ')}`
            : 'Does not collect personal data'
    },

    // Section 7: Consent requirements
    {
        obligationId: 'dpdp-sec7-consent',
        check: (p) => {
            if (!p.dataProcessing.collectsPersonalData) return 'DOES_NOT_APPLY';
            if (p.dataProcessing.requiresConsent === true) return 'APPLIES';
            if (p.dataProcessing.requiresConsent === false) return 'POTENTIALLY_APPLIES';
            return 'NEEDS_REVIEW';
        },
        confidence: (p) => p.dataProcessing.requiresConsent !== undefined ? 0.9 : 0.5,
        reason: (p) => {
            if (!p.dataProcessing.collectsPersonalData) return 'No personal data collection';
            if (p.dataProcessing.requiresConsent === true) return 'Explicit consent required for processing';
            if (p.dataProcessing.requiresConsent === false) return 'May qualify for deemed consent';
            return 'Consent requirements need manual assessment';
        }
    },

    // Section 9: Data Principal rights
    {
        obligationId: 'dpdp-sec9-rights',
        check: (p) => {
            if (!p.dataProcessing.collectsPersonalData) return 'DOES_NOT_APPLY';
            if (p.hasIndianUsers) return 'APPLIES';
            return 'POTENTIALLY_APPLIES';
        },
        confidence: (p) => p.hasIndianUsers ? 0.95 : 0.7,
        reason: (p) => p.hasIndianUsers
            ? 'Serves Indian data principals'
            : 'May serve Indian data principals'
    },

    // Section 11: Cross-border transfer
    {
        obligationId: 'dpdp-sec11-cross-border',
        check: (p) => {
            if (!p.dataProcessing.transfersInternationally) return 'DOES_NOT_APPLY';
            if (p.dataProcessing.internationalDestinations.length > 0) return 'APPLIES';
            return 'POTENTIALLY_APPLIES';
        },
        confidence: (p) => p.dataProcessing.transfersInternationally ? 0.85 : 1.0,
        reason: (p) => p.dataProcessing.transfersInternationally
            ? `Transfers data to: ${p.dataProcessing.internationalDestinations.join(', ') || 'unknown destinations'}`
            : 'No international data transfers detected'
    },

    // Section 14: Data Protection Officer
    {
        obligationId: 'dpdp-sec14-dpo',
        check: (p) => {
            if (!p.dataProcessing.collectsPersonalData) return 'DOES_NOT_APPLY';
            if (p.isDataFiduciary && p.companyInfo.employeeCount > 250) return 'APPLIES';
            if (p.isDataFiduciary) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (!p.dataProcessing.collectsPersonalData) return 1.0;
            if (p.isDataFiduciary && p.companyInfo.employeeCount > 250) return 0.95;
            return 0.7;
        },
        reason: (p) => {
            if (!p.dataProcessing.collectsPersonalData) return 'No personal data processing';
            if (p.isDataFiduciary && p.companyInfo.employeeCount > 250) {
                return `Significant fiduciary (${p.companyInfo.employeeCount} employees) - DPO likely mandatory`;
            }
            if (p.isDataFiduciary) return 'Data fiduciary - DPO may be required based on scale';
            return 'Not a data fiduciary under current assessment';
        }
    }
];

// ============================================================================
// IT Act 2000 / IT Rules 2021 Rules
// ============================================================================

const itActRules: ApplicabilityRule[] = [
    // Reasonable security practices (Section 43A)
    {
        obligationId: 'itact-43a-security',
        check: (p) => {
            if (p.dataProcessing.collectsSensitiveData || p.dataProcessing.collectsFinancialData) return 'APPLIES';
            if (p.dataProcessing.collectsPersonalData) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.dataProcessing.collectsSensitiveData) return 0.98;
            if (p.dataProcessing.collectsPersonalData) return 0.8;
            return 1.0;
        },
        reason: (p) => {
            const types: string[] = [];
            if (p.dataProcessing.collectsSensitiveData) types.push('sensitive');
            if (p.dataProcessing.collectsFinancialData) types.push('financial'); if (types.length > 0) return `Processes ${types.join(' and ')} data - security safeguards required`;
            if (p.dataProcessing.collectsPersonalData) return 'Processes personal data - security practices recommended';
            return 'No sensitive data processing detected';
        }
    },

    // Intermediary guidelines (IT Rules 2021)
    {
        obligationId: 'itrules-2021-intermediary',
        check: (p) => {
            if (p.isIntermediary) return 'APPLIES';
            if (p.hasUserGeneratedContent || p.hasSocialFeatures) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.isIntermediary) return 0.99;
            if (p.hasUserGeneratedContent) return 0.75;
            return 1.0;
        },
        reason: (p) => {
            if (p.isIntermediary) return 'Identified as intermediary service provider';
            if (p.hasUserGeneratedContent) return 'Hosts user content - may be classified as intermediary';
            return 'Not an intermediary service';
        }
    },

    // Cybersecurity incident reporting (IT Rules 2022)
    {
        obligationId: 'itrules-2022-incidents',
        check: (p) => {
            if (p.processesTransactions) return 'APPLIES';
            if (p.dataProcessing.collectsFinancialData) return 'POTENTIALLY_APPLIES';
            return 'NEEDS_REVIEW';
        },
        confidence: (p) => {
            if (p.processesTransactions) return 0.9;
            if (p.dataProcessing.collectsFinancialData) return 0.7;
            return 0.5;
        },
        reason: (p) => {
            if (p.processesTransactions) return 'Processes transactions - incident reporting mandatory within 6 hours';
            if (p.dataProcessing.collectsFinancialData) return 'Handles financial data - reporting may apply';
            return 'Need to assess if incident reporting timelines apply';
        }
    }
];

// ============================================================================
// Consumer Protection Act / E-Commerce Rules
// ============================================================================

const consumerRules: ApplicabilityRule[] = [
    // E-commerce rules applicability
    {
        obligationId: 'ecommerce-rules-seller',
        check: (p) => {
            if (p.sellsOnline && p.hasIndianCustomers) return 'APPLIES';
            if (p.sellsOnline) return 'POTENTIALLY_APPLIES';
            if (p.hasIndianCustomers) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.sellsOnline && p.hasIndianCustomers) return 0.95;
            if (p.sellsOnline || p.hasIndianCustomers) return 0.7;
            return 1.0;
        },
        reason: (p) => {
            if (p.sellsOnline && p.hasIndianCustomers) {
                return 'E-commerce business serving Indian consumers';
            }
            if (p.sellsOnline) return 'Sells online - e-commerce rules may apply depending on customer location';
            if (p.hasIndianCustomers) return 'Has Indian customers - rules may apply if selling goods/services';
            return 'Not an e-commerce business';
        }
    },

    // Refund policy requirements
    {
        obligationId: 'cpa-refund-policy',
        check: (p) => {
            if (p.sellsGoods || p.sellsServices) return 'APPLIES';
            if (p.hasDigitalProducts) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.sellsGoods || p.sellsServices) return 0.95;
            if (p.hasDigitalProducts) return 0.7;
            return 1.0;
        },
        reason: (p) => {
            const types: string[] = [];
            if (p.sellsGoods) types.push('goods');
            if (p.sellsServices) types.push('services');
            if (p.hasDigitalProducts) types.push('digital products'); if (types.length > 0) return `Sells ${types.join(' and ')} - refund policy required`;
            return 'No goods or services sold';
        }
    },

    // Cancellation policy requirements
    {
        obligationId: 'cpa-cancellation-policy',
        check: (p) => {
            if ((p.sellsGoods || p.sellsServices) && p.hasBookingSystem) return 'APPLIES';
            if (p.sellsServices || p.hasBookingSystem) return 'POTENTIALLY_APPLIES';
            if (p.sellsGoods) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.hasBookingSystem) return 0.9;
            if (p.sellsServices) return 0.8;
            if (p.sellsGoods) return 0.7;
            return 1.0;
        },
        reason: (p) => {
            if (p.hasBookingSystem) return 'Has booking system - cancellation policy required';
            if (p.sellsServices) return 'Provides services - cancellation terms needed';
            if (p.sellsGoods) return 'Sells goods - return/cancellation policy recommended';
            return 'No bookable or cancellable services';
        }
    },

    // Advertising and marketing disclosure
    {
        obligationId: 'cpa-advertising-disclosure',
        check: (p) => {
            if (p.runsAds || p.hasAffiliateMarketing) return 'APPLIES';
            if (p.hasMarketingEmails) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.runsAds) return 0.92;
            if (p.hasAffiliateMarketing) return 0.88;
            if (p.hasMarketingEmails) return 0.75;
            return 1.0;
        },
        reason: (p) => {
            const activities: string[] = [];
            if (p.runsAds) activities.push('advertising');
            if (p.hasAffiliateMarketing) activities.push('affiliate marketing');
            if (p.hasMarketingEmails) activities.push('email marketing');
            if (activities.length > 0) return `Engages in ${activities.join(' and ')} - disclosures required`;
            return 'No advertising or marketing activities detected';
        }
    }
];

// ============================================================================
// RBI / Payment Rules
// ============================================================================

const paymentRules: ApplicabilityRule[] = [
    // PCI-DSS for payment card handling
    {
        obligationId: 'rbi-pci-dss',
        check: (p) => {
            if (p.acceptsPayments && p.dataProcessing.collectsPaymentData) return 'APPLIES';
            if (p.acceptsPayments) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.acceptsPayments && p.dataProcessing.collectsPaymentData) return 0.97;
            if (p.acceptsPayments) return 0.7;
            return 1.0;
        },
        reason: (p) => {
            if (p.acceptsPayments && p.dataProcessing.collectsPaymentData) {
                return 'Collects payment card data - PCI-DSS compliance required';
            }
            if (p.acceptsPayments) return 'Accepts payments - PCI-DSS may apply depending on data handling';
            return 'Does not accept payments directly';
        }
    },

    // Payment data storage restrictions
    {
        obligationId: 'rbi-payment-storage',
        check: (p) => {
            if (p.dataProcessing.storesCVV || p.dataProcessing.storesCardData) return 'APPLIES';
            if (p.dataProcessing.collectsPaymentData) return 'POTENTIALLY_APPLIES';
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            if (p.dataProcessing.storesCVV || p.dataProcessing.storesCardData) return 0.99;
            if (p.dataProcessing.collectsPaymentData) return 0.65;
            return 1.0;
        },
        reason: (p) => {
            if (p.dataProcessing.storesCVV) return '⚠️ Stores CVV codes - PROHIBITED by RBI guidelines';
            if (p.dataProcessing.storesCardData) return 'Stores full card data - strict storage requirements apply';
            if (p.dataProcessing.collectsPaymentData) return 'Collects payment data - review storage practices';
            return 'No payment data collection';
        }
    }
];

// ============================================================================
// Cookie/Privacy Rules
// ============================================================================

const cookieRules: ApplicabilityRule[] = [
    // Cookie consent requirements
    {
        obligationId: 'cookie-consent-pdpd',
        check: (p) => {
            const hasCookies = p.technology.detectionResults.some(t => t.type === 'cookie');
            if (hasCookies) {
                if (p.hasIndianUsers) return 'APPLIES';
                return 'POTENTIALLY_APPLIES';
            }
            return 'DOES_NOT_APPLY';
        },
        confidence: (p) => {
            const hasCookies = p.technology.detectionResults.some(t => t.type === 'cookie');
            if (hasCookies && p.hasIndianUsers) return 0.95;
            if (hasCookies) return 0.7;
            return 1.0;
        },
        reason: (p) => {
            const cookies = p.technology.detectionResults.filter(t => t.type === 'cookie');
            if (cookies.length > 0) {
                const cookieNames = cookies.map(c => c.name || c.id).join(', ');
                return `Uses cookies/tracking: ${cookieNames}`;
            }
            return 'No cookies detected';
        }
    }
];

// ============================================================================
// All Rules Combined
// ============================================================================

const ALL_RULES: ApplicabilityRule[] = [
    ...dpdpRules,
    ...itActRules,
    ...consumerRules,
    ...paymentRules,
    ...cookieRules
];

// ============================================================================
// Main Engine Functions
// ============================================================================

/**
 * Run applicability analysis for a business profile
 */
export function analyzeApplicability(
    businessProfile: BusinessProfile
): ApplicabilityAnalysis {
    const results: ApplicabilityResult[] = [];

    // Run each rule against the profile
    for (const rule of ALL_RULES) {
        const status = rule.check(businessProfile);
        const confidence = rule.confidence(businessProfile);
        const reason = rule.reason(businessProfile);

        results.push({
            obligationId: rule.obligationId,
            status,
            confidence,
            reasons: [reason],
            requiresManualReview: status === 'NEEDS_REVIEW' || confidence < 0.7
        });
    }

    // Categorize results
    const applicableIds = results
        .filter(r => r.status === 'APPLIES')
        .map(r => r.obligationId);

    const potentiallyApplicableIds = results
        .filter(r => r.status === 'POTENTIALLY_APPLIES')
        .map(r => r.obligationId);

    const needsReviewIds = results
        .filter(r => r.status === 'NEEDS_REVIEW')
        .map(r => r.obligationId);

    // Match with obligation details
    const allObligations = SAMPLE_OBLIGATIONS;

    return {
        businessProfile,
        results,
        applicableObligations: allObligations.filter(o => applicableIds.includes(o.id)),
        potentiallyApplicableObligations: allObligations.filter(o => potentiallyApplicableIds.includes(o.id)),
        needsReviewObligations: allObligations.filter(o => needsReviewIds.includes(o.id)),
        summary: {
            totalChecked: results.length,
            applies: results.filter(r => r.status === 'APPLIES').length,
            doesNotApply: results.filter(r => r.status === 'DOES_NOT_APPLY').length,
            potentiallyApplies: results.filter(r => r.status === 'POTENTIALLY_APPLIES').length,
            needsReview: results.filter(r => r.status === 'NEEDS_REVIEW').length,
            unknown: results.filter(r => r.status === 'UNKNOWN').length
        }
    };
}

/**
 * Get applicability for a specific obligation
 */
export function checkObligationApplicability(
    obligationId: string,
    businessProfile: BusinessProfile
): ApplicabilityResult | null {
    const rule = ALL_RULES.find(r => r.obligationId === obligationId);

    if (!rule) {
        return null;
    }

    const status = rule.check(businessProfile);
    const confidence = rule.confidence(businessProfile);
    const reason = rule.reason(businessProfile);

    return {
        obligationId,
        status,
        confidence,
        reasons: [reason],
        requiresManualReview: status === 'NEEDS_REVIEW' || confidence < 0.7
    };
}

/**
 * Get all obligations that apply to a regulation
 */
export function getRegulationObligations(
    regulationId: string
): Obligation[] {
    return SAMPLE_OBLIGATIONS.filter(
        o => o.regulationId === regulationId
    );
}

/**
 * Check if a business needs a Data Protection Officer
 */
export function needsDPO(businessProfile: BusinessProfile): {
    required: boolean;
    reason: string;
    confidence: number;
} {
    const dpoCheck = checkObligationApplicability('dpdp-sec14-dpo', businessProfile);

    if (!dpoCheck) {
        return { required: false, reason: 'Unable to determine', confidence: 0 };
    }

    return {
        required: dpoCheck.status === 'APPLIES',
        reason: dpoCheck.reasons[0],
        confidence: dpoCheck.confidence
    };
}

/**
 * Generate compliance priority list
 */
export function generateCompliancePriority(
    analysis: ApplicabilityAnalysis
): Array<{
    obligation: Obligation;
    status: ApplicabilityStatus;
    priority: 'critical' | 'high' | 'medium' | 'low';
    effort: 'large' | 'medium' | 'small';
}> {
    const priorityList: Array<{
        obligation: Obligation;
        status: ApplicabilityStatus;
        priority: 'critical' | 'high' | 'medium' | 'low';
        effort: 'large' | 'medium' | 'small';
    }> = [];

    for (const result of analysis.results) {
        if (result.status === 'DOES_NOT_APPLY') continue;

        const obligation = SAMPLE_OBLIGATIONS.find(o => o.id === result.obligationId);
        if (!obligation) continue;

        // Determine priority based on severity and status
        let priority: 'critical' | 'high' | 'medium' | 'low';

        if (result.status === 'APPLIES') {
            switch (obligation.severity) {
                case 'critical': priority = 'critical'; break;
                case 'high': priority = 'high'; break;
                case 'medium': priority = 'medium'; break;
                default: priority = 'low';
            }
        } else if (result.status === 'POTENTIALLY_APPLIES') {
            priority = obligation.severity === 'critical' ? 'high' : 'medium';
        } else {
            priority = 'low';
        }

        priorityList.push({
            obligation,
            status: result.status,
            priority,
            effort: obligation.effortEstimate
        });
    }

    // Sort by priority (critical first), then by severity
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    priorityList.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };
        return severityOrder[a.obligation.severity] - severityOrder[b.obligation.severity];
    });

    return priorityList;
}

export { ALL_RULES };