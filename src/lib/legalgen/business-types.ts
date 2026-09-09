// ============================================
// COMPLETE V2 BUSINESS TYPES
// Replace entire content of business-types.ts
// ============================================

/**
 * Business Fact - Single piece of intelligence about a business
 * Replaces boolean flags like "hasPayments: true"
 */
export interface BusinessFact {
    id: string;
    category: 'data' | 'commerce' | 'technology' | 'operations' | 'legal';
    factType: string;
    value: boolean | string | number;
    confidence: number; // 0-1
    source: 'user_input' | 'scraper' | 'inference' | 'manual';
    detectedAt: Date;
    metadata?: Record<string, unknown>;
}

/**
 * Company Information
 */
export interface CompanyInfo {
    name: string;
    legalName?: string;
    registrationNumber?: string;
    entityType: 'sole_proprietorship' | 'partnership' | 'llp' | 'private_limited' | 'public_limited' | 'other';
    industry: string;
    subIndustry?: string;
    website: string;
    employeeCount: number;
    annualRevenue?: number;
    foundedYear?: number;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        pincode: string;
    };
    contactEmail: string;
    contactPhone?: string;
}

/**
 * Data Processing Profile - What data does this business handle?
 */
export interface DataProcessing {
    // Personal Data Collection
    collectsPersonalData: boolean;
    dataCategories: string[]; // e.g., ['name', 'email', 'phone', 'address']

    // Sensitive Data Types
    collectsSensitiveData: boolean;
    collectsFinancialData: boolean;
    collectsPaymentData: boolean;
    collectsHealthData: boolean;
    collectsChildrenData: boolean;

    // Consent & Processing Basis
    requiresConsent: boolean | undefined; // true/false/undefined (needs review)
    consentMechanism?: 'explicit' | 'implicit' | 'opt-out' | 'none';
    processingPurposes: string[];

    // Data Storage & Transfer
    storesCVV: boolean;
    storesCardData: boolean;
    dataStorageLocation: 'india' | 'eu' | 'us' | 'multiple' | 'unknown';
    transfersInternationally: boolean;
    internationalDestinations: string[];

    // Data Retention
    retentionPeriodMonths: number;
    anonymizesData: boolean;

    // Third Party Sharing
    sharesDataWithThirdParties: boolean;
    thirdPartyCategories: string[];
}

/**
 * Technology Detection Results
 */
export interface TechnologyDetection {
    detectionResults: Array<{
        id: string;
        name: string;
        type: 'cookie' | 'script' | 'form' | 'legal_page';
        detected: boolean;
        confidence: number;
        details?: Record<string, unknown>;
    }>;
}

/**
 * Full Business Profile - Complete picture of a business for compliance
 */
export interface BusinessProfile {
    id: string;
    companyInfo: CompanyInfo;
    businessFacts: BusinessFact[];
    dataProcessing: DataProcessing;
    technology: TechnologyDetection;

    // Derived flags (computed from facts)
    isDataFiduciary: boolean;
    isIntermediary: boolean;
    hasIndianUsers: boolean;
    hasIndianCustomers: boolean;
    sellsOnline: boolean;
    sellsGoods: boolean;
    sellsServices: boolean;
    hasDigitalProducts: boolean;
    acceptsPayments: boolean;
    processesTransactions: boolean;
    hasBookingSystem: boolean;
    runsAds: boolean;
    hasAffiliateMarketing: boolean;
    hasMarketingEmails: boolean;
    hasUserGeneratedContent: boolean;
    hasSocialFeatures: boolean;

    createdAt: Date;
    updatedAt: Date;
    version: number;
}

/**
 * Convert old V1 format to new V2 BusinessProfile
 */
export function convertToBusinessProfile(oldFormat: {
    companyName: string;
    website: string;
    businessType: string;
    features: Record<string, boolean>;
}): BusinessProfile {
    const facts: BusinessFact[] = Object.entries(oldFormat.features).map(
        ([key, value]) => ({
            id: key,
            category: categorizeFeature(key),
            factType: key,
            value,
            confidence: 0.8,
            source: 'user_input' as const,
            detectedAt: new Date()
        })
    );

    return {
        id: generateId(),
        companyInfo: {
            name: oldFormat.companyName,
            legalName: oldFormat.companyName,
            entityType: 'private_limited',
            industry: oldFormat.businessType,
            website: oldFormat.website,
            employeeCount: 50,
            contactEmail: ''
        },
        businessFacts: facts,
        dataProcessing: {
            collectsPersonalData: oldFormat.features.hasUsers || false,
            dataCategories: extractDataCategories(oldFormat.features),
            collectsSensitiveData: false,
            collectsFinancialData: oldFormat.features.hasPayments || false,
            collectsPaymentData: oldFormat.features.hasPayments || false,
            collectsHealthData: false,
            collectsChildrenData: false,
            requiresConsent: oldFormat.features.hasUsers ? true : undefined,
            processingPurposes: [],
            storesCVV: false,
            storesCardData: oldFormat.features.hasPayments || false,
            dataStorageLocation: 'unknown',
            transfersInternationally: false,
            internationalDestinations: [],
            retentionPeriodMonths: 12,
            anonymizesData: false,
            sharesDataWithThirdParties: false,
            thirdPartyCategories: []
        },
        technology: {
            detectionResults: []
        },
        isDataFiduciary: oldFormat.features.hasUsers || false,
        isIntermediary: false,
        hasIndianUsers: true,
        hasIndianCustomers: true,
        sellsOnline: oldFormat.features.sellsProducts || false,
        sellsGoods: oldFormat.features.sellsProducts || false,
        sellsServices: oldFormat.features.hasServices || false,
        hasDigitalProducts: oldFormat.features.hasDigitalProducts || false,
        acceptsPayments: oldFormat.features.hasPayments || false,
        processesTransactions: oldFormat.features.hasPayments || false,
        hasBookingSystem: oldFormat.features.hasBookingSystem || false,
        runsAds: oldFormat.features.hasAds || false,
        hasAffiliateMarketing: false,
        hasMarketingEmails: oldFormat.features.hasNewsletter || false,
        hasUserGeneratedContent: oldFormat.features.hasUserContent || false,
        hasSocialFeatures: oldFormat.features.hasSocialFeatures || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 2
    };
}

// Helper functions
function generateId(): string {
    return 'bp_' + Math.random().toString(36).substr(2, 9);
}

function categorizeFeature(feature: string): BusinessFact['category'] {
    if (feature.includes('payment') || feature.includes('subscription')) return 'commerce';
    if (feature.includes('user') || feature.includes('data') || feature.includes('cookie')) return 'data';
    if (feature.includes('social') || feature.includes('ads') || feature.includes('marketing')) return 'technology';
    return 'operations';
}

function extractDataCategories(features: Record<string, boolean>): string[] {
    const categories: string[] = [];
    if (features.hasUsers) categories.push('name', 'email');
    if (features.hasPayments) categories.push('payment_info');
    if (features.hasNewsletter) categories.push('email');
    return categories;
}