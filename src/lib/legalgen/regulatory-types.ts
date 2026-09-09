// =============================================================================
// LEGALGEN - REGULATORY TYPES (Upgraded for V2)
// =============================================================================
// Hierarchical: Regulation → Provision → Obligation
// Replaces flat LAW_REGISTRY object
// =============================================================================

// ─── 0. RISK CATEGORY TYPE (Needed by engines) ────────────────────────────

export type RiskCategory =
    | 'data_protection'
    | 'cybersecurity'
    | 'consumer_rights'
    | 'financial_compliance'
    | 'operational'
    | 'governance';

// ─── 1. REGULATION (Top Level) ───────────────────────────────────────────

export interface Regulation {
    id: string;                    // e.g., "IN-DPDP-2023"
    name: string;                  // "Digital Personal Data Protection Act, 2023"
    shortName: string;             // "DPDP Act"
    country: string;
    regulator: string;              // "MeitY"
    status: 'active' | 'upcoming' | 'repealed' | 'draft';
    effectiveFrom?: string;
    category: RegulationCategory;
    domains: ComplianceDomain[];
    provisions: string[];          // Child provision IDs
    lastVerified: string;
}

export type RegulationCategory =
    | 'data-protection' | 'consumer-protection' | 'cybersecurity'
    | 'financial' | 'telecommunications' | 'other';

export type ComplianceDomain =
    | 'privacy' | 'security' | 'consumer-rights' | 'financial-compliance'
    | 'transparency' | 'accountability' | 'governance';

// ─── 2. PROVISION (Middle Level) ─────────────────────────────────────────

export interface Provision {
    id: string;                    // e.g., "IN-DPDP-2023-S5"
    regulationId: string;
    section: string;               // "Section 5"
    title: string;                 // "Obligations of Data Fiduciary"
    summary: string;
    domain: ComplianceDomain;
    obligations: string[];         // Child obligation IDs
    status: 'active' | 'amended' | 'struck-down';
}

// ─── 3. OBLIGATION (Actionable Level) ─────────────────────────────────────

export interface Obligation {
    id: string;                    // e.g., "IN-DPDP-2023-S5-O1"
    provisionId: string;
    regulationId: string;
    title: string;
    description: string;

    // Applicability rules
    conditions: ApplicabilityCondition[];

    // Risk level
    severity: SeverityLevel;
    priority: PriorityLevel;

    // ✅ NEW: Category (needed by risk calculator)
    category: RiskCategory;

    // What's needed to comply
    requiredEvidence: string[];
    recommendedControls: string[];

    // ✅ NEW: Control requirements (needed by risk calculator)
    controlRequirements: string[];

    // Document requirements
    documentType?: string;         // e.g., "privacy-policy"

    // Frequency
    frequency: 'one-time' | 'annual' | 'continuous' | 'event-driven';

    // ✅ NEW: Effort estimate (needed by priority generator)
    effortEstimate: 'small' | 'medium' | 'large';

    // Metadata
    tags: string[];
    difficulty: 'easy' | 'moderate' | 'complex';
}

export interface ApplicabilityCondition {
    factKey: string;               // e.g., "processes_personal_data"
    operator: 'equals' | 'contains' | 'greater-than' | 'exists';
    value?: unknown;
    confidence: number;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type PriorityLevel = 'immediate' | 'high' | 'medium' | 'low' | 'monitor';

// ─── 4. APPLICABILITY STATUS (5-State) ───────────────────────────────────

export type ApplicabilityStatus =
    | 'APPLIES'              // Definitely applies (95%+ confidence)
    | 'DOES_NOT_APPLY'       // Definitely doesn't apply
    | 'POTENTIALLY_APPLIES'  // May apply, needs confirmation
    | 'NEEDS_REVIEW'         // Too complex for auto-determination
    | 'UNKNOWN';            // Not enough information

export interface ApplicabilityResult {
    targetId: string;              // Regulation/Obligation ID
    status: ApplicabilityStatus;
    confidence: number;            // 0-100

    // Reasoning
    reason: string;
    evidence: string[];

    // What would help?
    missingInfo?: string[];
    clarificationQuestions?: string[];
}

// ─── 5. INDIAN REGULATIONS DATABASE (Initial Set) ────────────────────────

export const INDIAN_REGULATIONS: Regulation[] = [
    {
        id: 'IN-DPDP-2023',
        name: 'Digital Personal Data Protection Act, 2023',
        shortName: 'DPDP Act',
        country: 'India',
        regulator: 'Ministry of Electronics & IT (MeitY)',
        status: 'active',
        effectiveFrom: '2023-08-11',
        category: 'data-protection',
        domains: ['privacy', 'security', 'accountability', 'transparency'],
        provisions: ['IN-DPDP-2023-S5', 'IN-DPDP-2023-S6'],
        lastVerified: '2024-01-15',
    },
    {
        id: 'IN-IT-2000',
        name: 'Information Technology Act, 2000',
        shortName: 'IT Act',
        country: 'India',
        regulator: 'MeitY',
        status: 'active',
        effectiveFrom: '2000-10-17',
        category: 'cybersecurity',
        domains: ['security', 'privacy', 'governance'],
        provisions: ['IN-IT-2000-S43', 'IN-IT-2000-S79'],
        lastVerified: '2024-01-15',
    },
    {
        id: 'IN-CPA-2019',
        name: 'Consumer Protection Act, 2019',
        shortName: 'Consumer Protection Act',
        country: 'India',
        regulator: 'Consumer Affairs Ministry',
        status: 'active',
        effectiveFrom: '2020-07-24',
        category: 'consumer-protection',
        domains: ['consumer-rights', 'transparency', 'accountability'],
        provisions: ['IN-CPA-2019-S6', 'IN-CPA-2019-S18'],
        lastVerified: '2024-01-15',
    },
    {
        id: 'IN-ECOM-RULES-2020',
        name: 'Consumer Protection (E-Commerce) Rules, 2020',
        shortName: 'E-Commerce Rules',
        country: 'India',
        regulator: 'Consumer Affairs Ministry',
        status: 'active',
        effectiveFrom: '2020-07-24',
        category: 'consumer-protection',
        domains: ['consumer-rights', 'transparency', 'accountability'],
        provisions: ['IN-ECOM-RULES-2020-R4', 'IN-ECOM-RULES-2020-R5'],
        lastVerified: '2024-01-15',
    },
    {
        id: 'IN-IT-RULES-2021',
        name: 'Information Technology (Intermediary Guidelines and Digital Media Ethics) Rules, 2021',
        shortName: 'IT Rules 2021',
        country: 'India',
        regulator: 'MeitY',
        status: 'active',
        effectiveFrom: '2021-02-26',
        category: 'cybersecurity',
        domains: ['governance', 'transparency', 'accountability'],
        provisions: ['IN-IT-RULES-2021-R3', 'IN-IT-RULES-2021-R4'],
        lastVerified: '2024-01-15',
    },
];

// ─── 6. OBLIGATIONS DATABASE (Examples) ──────────────────────────────────

export const SAMPLE_OBLIGATIONS: Obligation[] = [
    {
        id: 'OBL-DPDP-001',
        provisionId: 'IN-DPDP-2023-S5',
        regulationId: 'IN-DPDP-2023',
        title: 'Obtain Consent Before Processing Personal Data',
        description: 'Data fiduciary must obtain free, specific, informed, unconditional consent before processing personal data.',
        conditions: [
            { factKey: 'processes_personal_data', operator: 'exists', value: true, confidence: 0.95 }
        ],
        severity: 'critical',
        priority: 'immediate',

        // ✅ ADDED: Category
        category: 'data_protection',

        requiredEvidence: ['consent-mechanism', 'consent-record', 'privacy-notice'],
        recommendedControls: ['CTRL-DPDP-CONSENT-001'],

        // ✅ ADDED: Control requirements
        controlRequirements: ['consent-management'],

        documentType: 'privacy-policy',
        frequency: 'continuous',

        // ✅ ADDED: Effort estimate
        effortEstimate: 'medium',

        tags: ['consent', 'dpdp', 'privacy', 'data-protection'],
        difficulty: 'moderate',
    },
    {
        id: 'OBL-DPDP-002',
        provisionId: 'IN-DPDP-2023-S6',
        regulationId: 'IN-DPDP-2023',
        title: 'Publish Privacy Policy with Required Disclosures',
        description: 'Must publish a clear, comprehensive privacy policy explaining data practices.',
        conditions: [
            { factKey: 'has_website', operator: 'exists', value: true, confidence: 0.99 }
        ],
        severity: 'critical',
        priority: 'immediate',

        // ✅ ADDED: Category
        category: 'data_protection',

        requiredEvidence: ['privacy-policy-url', 'policy-content-check'],
        recommendedControls: ['CTRL-DPDP-PRIVACY-001'],

        // ✅ ADDED: Control requirements
        controlRequirements: ['privacy-policy'],

        documentType: 'privacy-policy',
        frequency: 'annual',

        // ✅ ADDED: Effort estimate
        effortEstimate: 'small',

        tags: ['privacy-policy', 'transparency', 'disclosure'],
        difficulty: 'easy',
    },
    {
        id: 'OBL-ECOM-001',
        provisionId: 'IN-ECOM-RULES-2020-R4',
        regulationId: 'IN-ECOM-RULES-2020',
        title: 'Display Cancellation & Refund Information',
        description: 'E-commerce entities must display cancellation, return, refund, and payment details.',
        conditions: [
            { factKey: 'sells_products', operator: 'exists', value: true, confidence: 0.9 },
            { factKey: 'business_model', operator: 'contains', value: 'ecommerce', confidence: 0.85 }
        ],
        severity: 'high',
        priority: 'high',

        // ✅ ADDED: Category
        category: 'consumer_rights',

        requiredEvidence: ['cancellation-policy', 'refund-policy', 'payment-info-displayed'],
        recommendedControls: ['CTRL-ECOM-DISCLOSURE-001'],

        // ✅ ADDED: Control requirements
        controlRequirements: ['policy-documentation'],

        documentType: 'cancellation-policy',
        frequency: 'annual',

        // ✅ ADDED: Effort estimate
        effortEstimate: 'small',

        tags: ['ecommerce', 'cancellation', 'refund', 'consumer-rights'],
        difficulty: 'easy',
    },
    {
        id: 'OBL-COOKIE-001',
        provisionId: 'IN-IT-RULES-2021-R3',
        regulationId: 'IN-IT-RULES-2021',
        title: 'Cookie Consent Mechanism',
        description: 'Websites using cookies must obtain user consent and provide cookie information.',
        conditions: [
            { factKey: 'uses_cookies', operator: 'exists', value: true, confidence: 0.92 }
        ],
        severity: 'high',
        priority: 'high',

        // ✅ ADDED: Category
        category: 'data_protection',

        requiredEvidence: ['cookie-banner', 'cookie-policy', 'consent-options'],
        recommendedControls: ['CTRL-COOKIE-CONSENT-001'],

        // ✅ ADDED: Control requirements
        controlRequirements: ['cookie-consent'],

        documentType: 'cookie-policy',
        frequency: 'continuous',

        // ✅ ADDED: Effort estimate
        effortEstimate: 'medium',

        tags: ['cookies', 'consent', 'tracking', 'it-rules'],
        difficulty: 'moderate',
    },

    // ✅ BONUS: Added more sample obligations for testing

    {
        id: 'OBL-SECURITY-001',
        provisionId: 'IN-IT-2000-S43',
        regulationId: 'IN-IT-2000',
        title: 'Implement Reasonable Security Practices',
        description: 'Must implement reasonable security practices to protect sensitive data.',
        conditions: [
            { factKey: 'collects_sensitive_data', operator: 'exists', value: true, confidence: 0.95 }
        ],
        severity: 'critical',
        priority: 'immediate',
        category: 'cybersecurity',
        requiredEvidence: ['security-policy', 'encryption-evidence', 'access-controls'],
        recommendedControls: ['CTRL-SEC-ENCRYPTION-001', 'CTRL-SEC-ACCESS-001'],
        controlRequirements: ['encryption-at-rest', 'encryption-in-transit', 'access-controls'],
        documentType: 'privacy-policy',
        frequency: 'continuous',
        effortEstimate: 'large',
        tags: ['security', 'encryption', 'it-act', 'data-protection'],
        difficulty: 'complex',
    },

    {
        id: 'OBL-PAYMENT-001',
        provisionId: 'IN-IT-2000-S43',
        regulationId: 'IN-IT-2000',
        title: 'Secure Payment Card Data Handling',
        description: 'Must handle payment card data securely per PCI-DSS standards.',
        conditions: [
            { factKey: 'accepts_payments', operator: 'exists', value: true, confidence: 0.98 }
        ],
        severity: 'critical',
        priority: 'immediate',
        category: 'financial_compliance',
        requiredEvidence: ['pci-compliance-cert', 'payment-gateway-docs', 'security-audit'],
        recommendedControls: ['CTRL-PAY-PCI-001', 'CTRL-PAY-TOKENIZATION-001'],
        controlRequirements: ['pci-dss', 'payment-storage-security'],
        documentType: 'privacy-policy',
        frequency: 'annual',
        effortEstimate: 'large',
        tags: ['payments', 'pci-dss', 'security', 'financial'],
        difficulty: 'complex',
    },

    {
        id: 'OBL-DPO-001',
        provisionId: 'IN-DPDP-2023-S10',
        regulationId: 'IN-DPDP-2023',
        title: 'Appoint Data Protection Officer (if applicable)',
        description: 'Significant data fiduciaries must appoint a Data Protection Officer.',
        conditions: [
            { factKey: 'is_data_fiduciary', operator: 'exists', value: true, confidence: 0.9 },
            { factKey: 'employee_count', operator: 'greater-than', value: 250, confidence: 0.85 }
        ],
        severity: 'high',
        priority: 'high',
        category: 'governance',
        requiredEvidence: ['dpo-appointment-letter', 'dpo-contact-details'],
        recommendedControls: ['CTRL-GOV-DPO-001'],
        controlRequirements: ['dpo-appointed'],
        documentType: 'privacy-policy',
        frequency: 'one-time',
        effortEstimate: 'medium',
        tags: ['dpo', 'governance', 'dpdp', 'accountability'],
        difficulty: 'easy',
    },
];