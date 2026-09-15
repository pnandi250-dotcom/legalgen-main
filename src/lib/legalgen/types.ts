// ─── DOCUMENT TYPES ──────────────────────────────────────────────────────────────

export type DocumentType =
  // ── Core Compliance (Original 6) ──
  | 'privacy-policy'
  | 'terms-of-service'
  | 'refund-policy'
  | 'cookie-policy'
  | 'disclaimer'
  | 'shipping-policy'
  // ── Business Operations ──
  | 'acceptable-use-policy'
  | 'cancellation-policy'
  | 'return-policy'
  | 'service-level-agreement'
  // ── User Agreements ──
  | 'end-user-license-agreement'
  | 'community-guidelines'
  // ── Data & Compliance ──
  | 'gdpr-compliance'
  | 'ccpa-compliance'        // NEW: California Consumer Privacy Act
  | 'uk-gdpr-compliance'     // NEW: UK GDPR + DPA 2018
  | 'data-processing-agreement'
  // ── Content & IP ──
  | 'dmca-policy'
  | 'content-moderation-policy';

// ─── JURISDICTIONS ──────────────────────────────────────────────────────────────

export type Jurisdiction = 
  | 'IN'   // India (DPDP Act 2023, IT Act)
  | 'EU'   // European Union (GDPR, ePrivacy, DSA)
  | 'US-CA' // USA - California (CCPA/CPRA)
  | 'US'   // USA - Federal + State laws
  | 'UK'   // United Kingdom (UK GDPR, DPA 2018)
  | 'GLOBAL'; // International/Multi-jurisdiction

export interface JurisdictionConfig {
  code: Jurisdiction;
  name: string;
  flag: string;
  region: string;
  primaryLaw: string;
  secondaryLaws: string[];
  authority: string;
  maxFine: string;
  features: JurisdictionFeature[];
}

export interface JurisdictionFeature {
  id: string;
  name: string;
  required: boolean;
  description: string;
}

// ─── JURISDICTION CONFIGURATIONS ────────────────────────────────────────────────

export const JURISDICTION_CONFIGS: Record<Jurisdiction, JurisdictionConfig> = {
  'IN': {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    region: 'Asia-Pacific',
    primaryLaw: 'Digital Personal Data Protection Act, 2023 (DPDP Act)',
    secondaryLaws: ['IT Act 2000', 'IT Rules 2021', 'Consumer Protection Act 2019'],
    authority: 'Ministry of Electronics & Information Technology (MeitY)',
    maxFine: '₹250 Crore (~$30M USD)',
    features: [
      { id: 'grievance-officer', name: 'Grievance Officer', required: true, description: 'Mandatory under IT Rules 2021' },
      { id: 'cert-in', name: 'CERT-In Reporting', required: true, description: 'Report breaches within 6 hours' }
    ]
  },
  'EU': {
    code: 'EU',
    name: 'European Union',
    flag: '🇪🇺',
    region: 'Europe',
    primaryLaw: 'General Data Protection Regulation (GDPR)',
    secondaryLaws: ['ePrivacy Directive', 'Digital Services Act'],
    authority: 'Data Protection Authorities (DPAs)',
    maxFine: '€20M or 4% global annual turnover',
    features: [
      { id: 'dpo', name: 'Data Protection Officer', required: true, description: 'Required for large-scale processing' },
      { id: 'consent-manager', name: 'Consent Management', required: true, description: 'Granular consent with easy withdrawal' },
      { id: 'data-portability', name: 'Data Portability', required: true, description: 'Users can request their data' }
    ]
  },
  'US-CA': {
    code: 'US-CA',
    name: 'California, USA',
    flag: '🇺🇸',
    region: 'North America',
    primaryLaw: 'California Consumer Privacy Act (CCPA) / CPRA',
    secondaryLaws: ['CalOPPA', 'Shine the Light Act'],
    authority: 'California Privacy Protection Agency (CPPA)',
    maxFine: '$7,500 per intentional violation',
    features: [
      { id: 'privacy-notice', name: '"Do Not Sell" Link', required: true, description: 'Opt-out of data sales' },
      { id: 'opt-out', name: 'Opt-Out Rights', required: true, description: 'Users can opt-out of data sales' }
    ]
  },
  'US': {
    code: 'US',
    name: 'United States (Federal)',
    flag: '🇺🇸',
    region: 'North America',
    primaryLaw: 'Sector-Specific Federal Laws',
    secondaryLaws: ['COPPA', 'HIPAA', 'GLBA', 'FTC Act Section 5'],
    authority: 'Federal Trade Commission (FTC)',
    maxFine: 'Varies - FTC: up to $50,000+ per violation',
    features: []
  },
  'UK': {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    region: 'Europe',
    primaryLaw: 'UK GDPR + Data Protection Act 2018',
    secondaryLaws: ['PECR', 'Online Safety Act 2023'],
    authority: 'Information Commissioner\'s Office (ICO)',
    maxFine: '£17.5M or 4% global annual turnover',
    features: [
      { id: 'pecr-cookies', name: 'PECR Cookie Consent', required: true, description: 'Cookie consent under PECR' }
    ]
  },
  'GLOBAL': {
    code: 'GLOBAL',
    name: 'International / Multi-Jurisdiction',
    flag: '🌍',
    region: 'Worldwide',
    primaryLaw: 'Multi-Jurisdictional Compliance Framework',
    secondaryLaws: ['GDPR', 'CCPA/CPRA', 'DPDP Act', 'LGPD', 'PIPEDA', 'APPI'],
    authority: 'Multiple Regulatory Bodies',
    maxFine: 'Varies by jurisdiction',
    features: []
  }
};

// ─── LEGAL REFERENCES ───────────────────────────────────────────────────────────

export interface LawReference {
  name: string;
  department: string;
  year?: string;
  section?: string;
  description?: string;
  jurisdiction?: Jurisdiction;
  url?: string;
}

/* ─── GLOBAL LAW REGISTRY ──────────────────────────────────────────────────────── */

export const LAW_REGISTRY: Record<string, LawReference[]> = {
  // ── EUROPEAN UNION ──
  'EU-GDPR': [
    { name: 'General Data Protection Regulation (GDPR)', department: 'European Commission', year: '2018', description: 'Comprehensive data protection regulation for EU', jurisdiction: 'EU', url: 'https://gdpr.eu/' },
    { name: 'ePrivacy Directive', department: 'European Parliament', year: '2002 (amended 2009)', description: 'Cookie and electronic communications privacy', jurisdiction: 'EU' },
    { name: 'Digital Services Act (DSA)', department: 'European Commission', year: '2022', description: 'Regulates online platforms and intermediaries', jurisdiction: 'EU' }
  ],

  // ── UNITED STATES - CALIFORNIA ──
  'US-California': [
    { name: 'California Consumer Privacy Act (CCPA)', department: 'California Attorney General', year: '2018 (effective 2020)', description: 'Gives CA residents rights to know, delete, opt-out of sale of personal info', jurisdiction: 'US-CA', url: 'https://oag.ca.gov/privacy/ccpa' },
    { name: 'California Privacy Rights Act (CPRA)', department: 'California Privacy Protection Agency', year: '2020 (effective 2023)', description: 'Amends CCPA. Creates CPPA, adds sensitive data category', jurisdiction: 'US-CA' }
  ],

  // ── UNITED KINGDOM ──
  'UK-ICO': [
    { name: 'UK General Data Protection Regulation (UK GDPR)', department: 'Information Commissioner\'s Office (ICO)', year: '2018 (post-Brexit)', description: 'UK\'s independent version of GDPR post-Brexit', jurisdiction: 'UK', url: 'https://ico.org.uk/for-organizations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/' },
    { name: 'Data Protection Act 2018', department: 'UK Parliament / ICO', year: '2018', description: 'Supplements UK GDPR. Covers national security exemptions, ICO powers', jurisdiction: 'UK' },
    { name: 'Privacy and Electronic Communications Regulations (PECR)', department: 'ICO / Ofcom', year: '2003 (amended)', description: 'UK implementation of ePrivacy Directive. Governs cookies, marketing emails', jurisdiction: 'UK' }
  ],

  // ── INDIA (Keep existing) ──
  'MeitY': [
    { name: 'Digital Personal Data Protection Act, 2023', department: 'MeitY', year: '2023', description: 'Comprehensive data protection law in India', jurisdiction: 'IN' },
    { name: 'Information Technology Act, 2000', department: 'MeitY', year: '2000', description: 'Primary law governing e-commerce and cybercrime in India', jurisdiction: 'IN' },
    { name: 'IT (Intermediary Guidelines) Rules, 2021', department: 'MeitY', year: '2021', description: 'Rules governing intermediaries and social media platforms', jurisdiction: 'IN' }
  ],
  'Consumer Affairs': [
    { name: 'Consumer Protection Act, 2019', department: 'Department of Consumer Affairs', year: '2019', description: 'Comprehensive consumer protection law', jurisdiction: 'IN' },
    { name: 'Consumer Protection (E-Commerce) Rules, 2020', department: 'Department of Consumer Affairs', year: '2020', description: 'Specific rules for e-commerce entities', jurisdiction: 'IN' }
  ],
  'RBI': [
    { name: 'RBI Master Direction on Payment Aggregators, 2020', department: 'Reserve Bank of India', year: '2020', description: 'Regulates payment aggregator services', jurisdiction: 'IN' }
  ],
  'MCA': [
    { name: 'Companies Act, 2013', department: 'Ministry of Corporate Affairs', year: '2013', description: 'Primary law governing companies in India', jurisdiction: 'IN' }
  ],
  'Law & Justice': [
    { name: 'Indian Contract Act, 1872', department: 'Ministry of Law & Justice', year: '1872', description: 'Foundational contract law in India', jurisdiction: 'IN' },
    { name: 'Arbitration and Conciliation Act, 1996', department: 'Ministry of Law & Justice', year: '1996', description: 'Governs domestic and international arbitration', jurisdiction: 'IN' }
  ],
  'SEBI': [
    { name: 'SEBI (Intermediaries) Regulations, 2008', department: 'Securities and Exchange Board of India', year: '2008', description: 'Regulates intermediaries including investment advisors', jurisdiction: 'IN' }
  ],
  'TRAI': [
    { name: 'TRAI Act, 1997', department: 'Telecom Regulatory Authority of India', year: '1997', description: 'Establishes TRAI and its powers', jurisdiction: 'IN' }
  ],
  'Health & Pharma': [
    { name: 'Drugs and Cosmetics Act, 1940', department: 'Ministry of Health and Family Welfare', year: '1940', description: 'Regulates import, manufacture of drugs and cosmetics', jurisdiction: 'IN' }
  ],
  'Education': [
    { name: 'UGC (Online Education) Regulations, 2021', department: 'University Grants Commission', year: '2021', description: 'Regulates online degree programs', jurisdiction: 'IN' }
  ],
  'Labour & Employment': [
    { name: 'Code on Wages, 2019', department: 'Ministry of Labour & Employment', year: '2019', description: 'Consolidates wage-related labour laws', jurisdiction: 'IN' }
  ]
};

// ─── QUESTION TYPES ─────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'select' | 'multiselect' | 'checkbox' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string; warning?: string }[];
  tooltip?: string;
  warning?: string;
  group?: string;
  jurisdictions?: Jurisdiction[];
  excludeJurisdictions?: Jurisdiction[];
}

export interface QuestionGroup {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  jurisdictions?: Jurisdiction[];
}

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  description: string;
  icon: string;
  color: string;
  groups: QuestionGroup[];
  supportedJurisdictions?: Jurisdiction[];
}

export interface GeneratedDocument {
  html: string;
  text: string;
  title: string;
  complianceInfo?: {
    laws: LawReference[];
    lastUpdated: string;
    jurisdiction: Jurisdiction;
  };
}

export interface FormData {
  [key: string]: string | string[] | boolean | undefined;
}