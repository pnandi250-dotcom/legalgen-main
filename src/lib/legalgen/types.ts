import React from 'react';

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
  | 'data-processing-agreement'
  // ── Content & IP ──
  | 'dmca-policy'
  | 'content-moderation-policy';

export interface LawReference {
  name: string;
  department: string;
  year?: string;
  section?: string;
  description?: string;
}

export interface Question {
  id: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'boolean';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string; warning?: string }[];
  tooltip?: string;
  warning?: string;
  group?: string;
  icon?: React.ReactNode;
  description?: string;
}
export interface QuestionGroup {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  description: string;
  icon: string;
  color: string;
  groups: QuestionGroup[];
}

export interface GeneratedDocument {
  html: string;
  text: string;
  title: string;
  complianceInfo?: {
    laws: LawReference[];
    lastUpdated: string;
    jurisdiction: string;
  };
}

export interface FormData {
  [key: string]: string | string[] | boolean | undefined;
}

/* ── Department-wise Indian Law Registry ── */
export const LAW_REGISTRY: Record<string, LawReference[]> = {
  'MeitY': [
    { name: 'Information Technology Act, 2000', department: 'Ministry of Electronics & Information Technology', year: '2000', description: 'Primary law governing electronic commerce, digital signatures, cybercrime, and data protection in India' },
    { name: 'IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021', department: 'MeitY', year: '2021', description: 'Rules governing intermediaries, social media platforms, and digital media ethics' },
    { name: 'Digital Personal Data Protection Act, 2023', department: 'MeitY', year: '2023', description: 'Comprehensive data protection law governing processing of personal data in India' },
    { name: 'IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011', department: 'MeitY', year: '2011', description: 'Rules specifying security practices for protecting sensitive personal data' },
    { name: 'CERT-In Directions under Section 70B of IT Act, 2022', department: 'MeitY', year: '2022', description: 'Mandatory cyber incident reporting within 6 hours to Indian Computer Emergency Response Team' },
  ],
  'Consumer Affairs': [
    { name: 'Consumer Protection Act, 2019', department: 'Department of Consumer Affairs', year: '2019', description: 'Comprehensive consumer protection law covering e-commerce, unfair trade practices, and product liability' },
    { name: 'Consumer Protection (E-Commerce) Rules, 2020', department: 'Department of Consumer Affairs', year: '2020', description: 'Specific rules for e-commerce entities covering liability, refunds, and disclosure requirements' },
    { name: 'Consumer Protection (Direct Selling) Rules, 2021', department: 'Department of Consumer Affairs', year: '2021', description: 'Rules governing direct selling companies and their network of sellers' },
    { name: 'Consumer Protection (Jurisdiction of the District Commission, the State Commission and the National Commission) Rules, 2020', department: 'Department of Consumer Affairs', year: '2020', description: 'Rules defining pecuniary jurisdiction for consumer disputes' },
    { name: 'Central Consumer Protection Authority (CCPA) Guidelines, 2022', department: 'Department of Consumer Affairs', year: '2022', description: 'Guidelines on preventing unfair trade practices and misleading advertisements' },
  ],
  'RBI': [
    { name: 'RBI Master Direction on Payment Aggregators, 2020', department: 'Reserve Bank of India', year: '2020', description: 'Regulates payment aggregator services and their compliance requirements' },
    { name: 'RBI Guidelines on Regulation of Payment Aggregators and Payment Gateways, 2024', department: 'Reserve Bank of India', year: '2024', description: 'Updated guidelines for payment processing compliance' },
    { name: 'RBI Master Direction on KYC Direction, 2016 (updated 2024)', department: 'Reserve Bank of India', year: '2016', description: 'Know Your Customer norms for financial services and payment providers' },
    { name: 'Digital Lending Guidelines, 2022', department: 'Reserve Bank of India', year: '2022', description: 'Guidelines for digital lending platforms and NBFCs' },
    { name: 'RBI Master Direction on Information Security, 2024', department: 'Reserve Bank of India', year: '2024', description: 'Information security requirements for regulated entities' },
  ],
  'MCA': [
    { name: 'Companies Act, 2013', department: 'Ministry of Corporate Affairs', year: '2013', description: 'Primary law governing incorporation, management, and dissolution of companies in India' },
    { name: 'Companies (Incorporation) Rules, 2014', department: 'Ministry of Corporate Affairs', year: '2014', description: 'Rules for company incorporation procedures and compliance' },
    { name: 'Limited Liability Partnership Act, 2008', department: 'Ministry of Corporate Affairs', year: '2008', description: 'Law governing LLPs in India, their formation, and operation' },
    { name: 'Companies (Corporate Social Responsibility Policy) Rules, 2014', department: 'Ministry of Corporate Affairs', year: '2014', description: 'Rules mandating CSR spending and reporting for qualifying companies' },
  ],
  'Law & Justice': [
    { name: 'Indian Contract Act, 1872', department: 'Ministry of Law & Justice', year: '1872', description: 'Foundational law governing contracts, offer-acceptance, consideration, and breach' },
    { name: 'Arbitration and Conciliation Act, 1996', department: 'Ministry of Law & Justice', year: '1996', description: 'Governs domestic and international arbitration, conciliation, and dispute resolution' },
    { name: 'Copyright Act, 1957 (amended 2012)', department: 'Ministry of Law & Justice', year: '1957', description: 'Protects original literary, dramatic, musical, and artistic works' },
    { name: 'Trade Marks Act, 1999', department: 'Ministry of Law & Justice', year: '1999', description: 'Governs registration, protection, and enforcement of trademarks in India' },
    { name: 'Information Technology (Amendment) Act, 2008', department: 'Ministry of Law & Justice', year: '2008', description: 'Amended IT Act 2000 to include provisions on cyber terrorism, data protection, and intermediary liability' },
    { name: 'Indian Penal Code, 1860 (replaced by BNS 2023)', department: 'Ministry of Law & Justice', year: '2023', description: 'Bharatiya Nyaya Sanhita (BNS) 2023 replaced IPC — covers criminal liability including cybercrime' },
  ],
  'SEBI': [
    { name: 'SEBI (Intermediaries) Regulations, 2008', department: 'Securities and Exchange Board of India', year: '2008', description: 'Regulates intermediaries including investment advisors and research analysts' },
    { name: 'SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015', department: 'Securities and Exchange Board of India', year: '2015', description: 'Governs disclosure requirements for listed companies' },
    { name: 'SEBI (Investment Advisers) Regulations, 2013', department: 'Securities and Exchange Board of India', year: '2013', description: 'Regulates investment advisory services in India' },
    { name: 'SEBI Cybersecurity and Cyber Resilience Framework, 2024', department: 'Securities and Exchange Board of India', year: '2024', description: 'Cybersecurity framework for regulated entities including stock brokers and mutual funds' },
  ],
  'TRAI': [
    { name: 'Telecom Regulatory Authority of India Act, 1997', department: 'Telecom Regulatory Authority of India', year: '1997', description: 'Establishes TRAI and its powers to regulate telecom services' },
    { name: 'TRAI Telecom Commercial Communications Customer Preference Regulations, 2018 (amended 2023)', department: 'TRAI', year: '2018', description: 'Regulates commercial communications, SMS, and Do Not Call registry' },
    { name: 'TRAI (Data Security and Privacy) Regulations, 2024', department: 'TRAI', year: '2024', description: 'Data protection and privacy standards for telecom service providers' },
  ],
  'Health & Pharma': [
    { name: 'Drugs and Cosmetics Act, 1940', department: 'Ministry of Health and Family Welfare', year: '1940', description: 'Regulates import, manufacture, and distribution of drugs and cosmetics in India' },
    { name: 'Clinical Establishments (Registration and Regulation) Act, 2010', department: 'Ministry of Health and Family Welfare', year: '2010', description: 'Regulates clinical establishments to ensure minimum standards of healthcare' },
    { name: 'National Pharmaceutical Pricing Authority (NPPA) Guidelines', department: 'Department of Pharmaceuticals', year: '2023', description: 'Regulates pricing of pharmaceutical products in India' },
    { name: 'Digital Health Information in Electronic Healthcare Standards, 2023', department: 'Ministry of Health and Family Welfare', year: '2023', description: 'Standards for digital health records and electronic health information exchange' },
  ],
  'Education': [
    { name: 'All India Council for Technical Education (AICTE) Regulations, 2024', department: 'Ministry of Education', year: '2024', description: 'Regulations governing technical education institutions and online learning platforms' },
    { name: 'University Grants Commission (Online Education) Regulations, 2021', department: 'Ministry of Education', year: '2021', description: 'Regulates online degree programs and e-learning platforms' },
  ],
  'Labour & Employment': [
    { name: 'Code on Wages, 2019', department: 'Ministry of Labour & Employment', year: '2019', description: 'Consolidates laws relating to wages, bonus, and payment of wages' },
    { name: 'Industrial Relations Code, 2020', department: 'Ministry of Labour & Employment', year: '2020', description: 'Consolidates laws relating to trade unions, industrial disputes, and standing orders' },
    { name: 'Code on Social Security, 2020', department: 'Ministry of Labour & Employment', year: '2020', description: 'Consolidates laws relating to provident fund, ESI, gratuity, and maternity benefits' },
    { name: 'Occupational Safety, Health and Working Conditions Code, 2020', department: 'Ministry of Labour & Employment', year: '2020', description: 'Consolidates 13 labour laws relating to workplace safety and working conditions' },
  ],
};