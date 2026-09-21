// src/lib/classifier/taxonomy.ts
// Extensible policy taxonomy for global compliance discovery

export type PolicyCategory =
  | 'privacy'
  | 'terms'
  | 'commerce'
  | 'governance'
  | 'security'
  | 'employment'
  | 'intellectual-property'
  | 'accessibility'
  | 'regional';

export interface PolicyConfig {
  /** Human-readable name */
  name: string;

  /** Category for grouping */
  category: PolicyCategory;

  /** Alternative names/aliases used across jurisdictions */
  aliases: string[];

  /** Keywords that indicate this policy type in content */
  keywords: string[];

  /** Regulatory frameworks commonly associated */
  regulatoryLinks: string[];

  /** Typical URL patterns (used as hints, not definitive) */
  urlPatterns?: string[];

  /** Whether this is typically a standalone document */
  isStandalone?: boolean;

  /** Related policy types that often co-occur */
  relatedPolicies?: string[];
}

export interface PolicyTaxonomy {
  [policyType: string]: PolicyConfig;
}

/**
 * Core policy taxonomy - extensible and jurisdiction-agnostic
 */
export const POLICY_TAXONOMY: PolicyTaxonomy = {
  // ==================== PRIVACY & DATA PROTECTION ====================
  'privacy-policy': {
    name: 'Privacy Policy',
    category: 'privacy',
    aliases: [
      'privacy notice',
      'data protection policy',
      'personal information policy',
      'privacy statement',
      'data privacy policy',
      'information privacy policy'
    ],
    keywords: [
      'personal data',
      'data collection',
      'data processing',
      'data subject rights',
      'information we collect',
      'how we use your data',
      'data sharing',
      'privacy practices'
    ],
    regulatoryLinks: ['GDPR', 'CCPA', 'DPDP', 'PIPEDA', 'LGPD', 'UK GDPR'],
    urlPatterns: ['/privacy', '/privacy-policy', '/data-protection', '/gdpr'],
    isStandalone: true,
    relatedPolicies: ['cookie-policy', 'data-processing-agreement', 'consent-policy']
  },

  'cookie-policy': {
    name: 'Cookie Policy',
    category: 'privacy',
    aliases: [
      'cookie notice',
      'cookie disclosure',
      'cookie statement',
      'tracking policy'
    ],
    keywords: [
      'cookie usage',
      'third-party cookies',
      'cookie consent',
      'tracking technologies',
      'we use cookies',
      'cookie preferences'
    ],
    regulatoryLinks: ['ePrivacy', 'GDPR', 'PECR', 'CCPA'],
    urlPatterns: ['/cookies', '/cookie-policy', '/cookie-notice'],
    isStandalone: true,
    relatedPolicies: ['privacy-policy', 'consent-policy']
  },

  'consent-policy': {
    name: 'Consent Management Policy',
    category: 'privacy',
    aliases: [
      'consent policy',
      'consent management',
      'opt-in policy',
      'permission settings'
    ],
    keywords: [
      'consent management',
      'opt-in',
      'opt-out',
      'withdraw consent',
      'consent withdrawal',
      'granular consent'
    ],
    regulatoryLinks: ['GDPR', 'ePrivacy', 'CCPA'],
    isStandalone: false,
    relatedPolicies: ['privacy-policy', 'cookie-policy']
  },

  'data-processing-agreement': {
    name: 'Data Processing Agreement',
    category: 'privacy',
    aliases: [
      'DPA',
      'data processing addendum',
      'processor agreement',
      'data processing terms'
    ],
    keywords: [
      'data processor',
      'data controller',
      'processing instructions',
      'subprocessor',
      'data transfer safeguards'
    ],
    regulatoryLinks: ['GDPR', 'UK GDPR'],
    urlPatterns: ['/dpa', '/data-processing', '/processor-agreement'],
    isStandalone: true,
    relatedPolicies: ['privacy-policy', 'security-policy']
  },

  'data-retention-policy': {
    name: 'Data Retention Policy',
    category: 'privacy',
    aliases: [
      'retention policy',
      'data retention schedule',
      'record retention'
    ],
    keywords: [
      'retention period',
      'data deletion',
      'how long we keep',
      'retention schedule',
      'dispose of data'
    ],
    regulatoryLinks: ['GDPR', 'SOX', 'HIPAA'],
    isStandalone: false,
    relatedPolicies: ['privacy-policy', 'data-deletion-policy']
  },

  'data-deletion-policy': {
    name: 'Data Deletion Policy',
    category: 'privacy',
    aliases: [
      'deletion policy',
      'right to erasure',
      'data removal',
      'account deletion'
    ],
    keywords: [
      'delete your data',
      'right to erasure',
      'data removal',
      'account closure',
      'permanent deletion'
    ],
    regulatoryLinks: ['GDPR', 'CCPA', 'DPDP'],
    isStandalone: false,
    relatedPolicies: ['privacy-policy', 'data-retention-policy']
  },

  // ==================== TERMS & AGREEMENTS ====================
  'terms-of-service': {
    name: 'Terms of Service',
    category: 'terms',
    aliases: [
      'terms of use',
      'user agreement',
      'website terms',
      'terms and conditions',
      'service agreement',
      'platform terms'
    ],
    keywords: [
      'binding agreement',
      'acceptance of terms',
      'modification of terms',
      'termination of service',
      'governing law',
      'dispute resolution'
    ],
    regulatoryLinks: [],
    urlPatterns: ['/terms', '/terms-of-service', '/tos', '/user-agreement'],
    isStandalone: true,
    relatedPolicies: ['privacy-policy', 'acceptable-use-policy', 'refund-policy']
  },

  'end-user-license-agreement': {
    name: 'End User License Agreement',
    category: 'terms',
    aliases: [
      'EULA',
      'software license',
      'license agreement',
      'software terms'
    ],
    keywords: [
      'license grant',
      'restricted uses',
      'ownership rights',
      'software license',
      'intellectual property license'
    ],
    regulatoryLinks: [],
    urlPatterns: ['/eula', '/license', '/software-license'],
    isStandalone: true,
    relatedPolicies: ['terms-of-service', 'privacy-policy']
  },

  // ==================== COMMERCE & TRANSACTIONS ====================
  'refund-policy': {
    name: 'Refund Policy',
    category: 'commerce',
    aliases: [
      'refunds',
      'money back policy',
      'refund terms',
      'refund eligibility'
    ],
    keywords: [
      'refund eligibility',
      'refund process',
      'refund timeline',
      'money back guarantee',
      'refund request',
      'full refund',
      'partial refund'
    ],
    regulatoryLinks: ['Consumer Protection Act', 'EU Consumer Rights Directive'],
    urlPatterns: ['/refund', '/refund-policy', '/refunds', '/money-back'],
    isStandalone: true,
    relatedPolicies: ['return-policy', 'terms-of-service', 'cancellation-policy']
  },

  'return-policy': {
    name: 'Return Policy',
    category: 'commerce',
    aliases: [
      'returns',
      'return process',
      'product returns',
      'exchange policy'
    ],
    keywords: [
      'return window',
      'return conditions',
      'return shipping',
      'product return',
      'exchange items',
      'return authorization'
    ],
    regulatoryLinks: ['Consumer Protection Act', 'EU Consumer Rights Directive'],
    urlPatterns: ['/return', '/return-policy', '/returns', '/exchanges'],
    isStandalone: true,
    relatedPolicies: ['refund-policy', 'shipping-policy', 'terms-of-service']
  },

  'shipping-policy': {
    name: 'Shipping/Delivery Policy',
    category: 'commerce',
    aliases: [
      'delivery policy',
      'shipping terms',
      'delivery information',
      'shipping information'
    ],
    keywords: [
      'shipping methods',
      'delivery time',
      'shipping cost',
      'free shipping',
      'international shipping',
      'order tracking',
      'delivery areas'
    ],
    regulatoryLinks: [],
    urlPatterns: ['/shipping', '/delivery', '/shipping-policy'],
    isStandalone: true,
    relatedPolicies: ['return-policy', 'refund-policy', 'terms-of-service']
  },

  'cancellation-policy': {
    name: 'Cancellation Policy',
    category: 'commerce',
    aliases: [
      'cancellations',
      'cancel order',
      'order cancellation',
      'subscription cancellation'
    ],
    keywords: [
      'cancel order',
      'cancellation fee',
      'cancel subscription',
      'cancellation deadline',
      'how to cancel'
    ],
    regulatoryLinks: ['Consumer Protection Act', 'EU Consumer Rights Directive'],
    urlPatterns: ['/cancellation', '/cancel', '/cancellation-policy'],
    isStandalone: true,
    relatedPolicies: ['refund-policy', 'return-policy', 'subscription-terms']
  },

  'payment-terms': {
    name: 'Payment Terms',
    category: 'commerce',
    aliases: [
      'payment policy',
      'billing terms',
      'payment methods',
      'pricing terms'
    ],
    keywords: [
      'accepted payment methods',
      'billing cycle',
      'payment security',
      'auto-renewal',
      'recurring payments'
    ],
    regulatoryLinks: ['PCI DSS', 'PSD2'],
    urlPatterns: ['/payment', '/billing', '/payment-terms'],
    isStandalone: false,
    relatedPolicies: ['terms-of-service', 'subscription-terms', 'refund-policy']
  },

  'subscription-terms': {
    name: 'Subscription Terms',
    category: 'commerce',
    aliases: [
      'subscription agreement',
      'membership terms',
      'recurring billing terms',
      'plan terms'
    ],
    keywords: [
      'subscription plan',
      'auto-renewal',
      'billing period',
      'membership tier',
      'subscription cancellation'
    ],
    regulatoryLinks: ['Consumer Protection Act'],
    urlPatterns: ['/subscription', '/membership', '/plans'],
    isStandalone: false,
    relatedPolicies: ['terms-of-service', 'payment-terms', 'cancellation-policy']
  },

  // ==================== GOVERNANCE & CONDUCT ====================
  'acceptable-use-policy': {
    name: 'Acceptable Use Policy',
    category: 'governance',
    aliases: [
      'AUP',
      'code of conduct',
      'user conduct policy',
      'acceptable use guidelines'
    ],
    keywords: [
      'prohibited uses',
      'acceptable use',
      'violations',
      'misuse of service',
      'unauthorized access',
      'abuse reporting'
    ],
    regulatoryLinks: [],
    urlPatterns: ['/acceptable-use', '/aup', '/code-of-conduct'],
    isStandalone: true,
    relatedPolicies: ['terms-of-service', 'community-guidelines', 'content-moderation-policy']
  },

  'community-guidelines': {
    name: 'Community Guidelines',
    category: 'governance',
    aliases: [
      'community rules',
      'community standards',
      'user guidelines',
      'conduct guidelines'
    ],
    keywords: [
      'community standards',
      'respectful behavior',
      'harassment policy',
      'hate speech',
      'community safety'
    ],
    regulatoryLinks: [],
    urlPatterns: ['/community', '/guidelines', '/community-guidelines'],
    isStandalone: true,
    relatedPolicies: ['acceptable-use-policy', 'content-moderation-policy', 'terms-of-service']
  },

  'content-moderation-policy': {
    name: 'Content Moderation Policy',
    category: 'governance',
    aliases: [
      'moderation policy',
      'content policy',
      'user content policy',
      'UGC policy'
    ],
    keywords: [
      'content moderation',
      'user-generated content',
      'content removal',
      'moderation process',
      'appeal content decisions'
    ],
    regulatoryLinks: ['DSA', 'Section 230'],
    urlPatterns: ['/moderation', '/content-policy', '/ugc-policy'],
    isStandalone: true,
    relatedPolicies: ['community-guidelines', 'acceptable-use-policy', 'terms-of-service']
  },

  'intellectual-property-policy': {
    name: 'Intellectual Property Policy',
    category: 'governance',
    aliases: [
      'IP policy',
      'copyright policy',
      'trademark policy',
      'IP rights'
    ],
    keywords: [
      'intellectual property',
      'copyright infringement',
      'trademark',
      'DMCA',
      'IP ownership',
      'patent rights'
    ],
    regulatoryLinks: ['DMCA', 'Copyright Act'],
    urlPatterns: ['/ip', '/intellectual-property', '/copyright'],
    isStandalone: false,
    relatedPolicies: ['terms-of-service', 'dmca-policy']
  },

  'dmca-policy': {
    name: 'DMCA/Copyright Policy',
    category: 'governance',
    aliases: [
      'copyright policy',
      'DMCA notice',
      'takedown policy',
      'copyright infringement'
    ],
    keywords: [
      'DMCA',
      'Digital Millennium Copyright Act',
      'copyright agent',
      'takedown notice',
      'counter-notice'
    ],
    regulatoryLinks: ['DMCA'],
    urlPatterns: ['/dmca', '/copyright', '/takedown'],
    isStandalone: true,
    relatedPolicies: ['intellectual-property-policy', 'terms-of-service']
  },

  // ==================== SECURITY ====================
  'security-policy': {
    name: 'Security Policy',
    category: 'security',
    aliases: [
      'information security policy',
      'security practices',
      'data security',
      'security measures'
    ],
    keywords: [
      'security measures',
      'encryption',
      'security practices',
      'data protection measures',
      'security certifications'
    ],
    regulatoryLinks: ['SOC 2', 'ISO 27001', 'GDPR'],
    urlPatterns: ['/security', '/security-policy', '/security-practices'],
    isStandalone: true,
    relatedPolicies: ['privacy-policy', 'data-processing-agreement']
  },

  // ==================== ACCESSIBILITY ====================
  'accessibility-policy': {
    name: 'Accessibility Policy',
    category: 'accessibility',
    aliases: [
      'accessibility statement',
      'wcag compliance',
      'disability access',
      'accessible services'
    ],
    keywords: [
      'accessibility',
      'WCAG',
      'disability access',
      'screen reader',
      'accessible design',
      'ADA compliance'
    ],
    regulatoryLinks: ['ADA', 'WCAG', 'Section 508', 'EAA'],
    urlPatterns: ['/accessibility', '/accessibility-statement'],
    isStandalone: true,
    relatedPolicies: ['terms-of-service']
  },

  // ==================== EMPLOYMENT (where publicly posted) ====================
  'employment-policy': {
    name: 'Employment Policy',
    category: 'employment',
    aliases: [
      'hr policy',
      'employment terms',
      'workplace policy'
    ],
    keywords: [
      'employment opportunities',
      'equal opportunity',
      'workplace conduct',
      'employee handbook'
    ],
    regulatoryLinks: ['EEOC', 'Labor Laws'],
    urlPatterns: ['/careers', '/employment', '/jobs'],
    isStandalone: false,
    relatedPolicies: []
  }
};

/**
 * Register a new policy type dynamically
 * Allows extending the taxonomy without modifying core code
 */
export function registerPolicyType(type: string, config: PolicyConfig): void {
  if (POLICY_TAXONOMY[type]) {
    console.warn(`[Taxonomy] Policy type "${type}" already exists. Overwriting.`);
  }
  POLICY_TAXONOMY[type] = config;
}

/**
 * Get all policy types in a specific category
 */
export function getPolicyTypesByCategory(category: PolicyCategory): string[] {
  return Object.entries(POLICY_TAXONOMY)
    .filter(([, config]) => config.category === category)
    .map(([type]) => type);
}

/**
 * Find policy type by alias (case-insensitive)
 */
export function findPolicyByAlias(alias: string): string | null {
  const normalizedAlias = alias.toLowerCase().trim();

  for (const [type, config] of Object.entries(POLICY_TAXONOMY)) {
    if (config.aliases.some(a => a.toLowerCase() === normalizedAlias)) {
      return type;
    }
    // Also check the main name
    if (config.name.toLowerCase() === normalizedAlias) {
      return type;
    }
  }

  return null;
}

/**
 * Check if a policy type exists in the taxonomy
 */
export function isValidPolicyType(type: string): boolean {
  return type in POLICY_TAXONOMY;
}

/**
 * Get configuration for a specific policy type
 */
export function getPolicyConfig(type: string): PolicyConfig | undefined {
  return POLICY_TAXONOMY[type];
}

/**
 * Get all available policy types
 */
export function getAllPolicyTypes(): string[] {
  return Object.keys(POLICY_TAXONOMY);
}
