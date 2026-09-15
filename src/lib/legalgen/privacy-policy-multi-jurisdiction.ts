// src/lib/legalgen/privacy-policy-multi-jurisdiction.ts
// Multi-Jurisdiction Privacy Policy Generator
// Supports: IN (DPDP Act), EU (GDPR), US-CA (CCPA/CPRA), US (Federal), UK (UK GDPR+DPA2018), GLOBAL

import { 
  LAW_REGISTRY, 
  type FormData, 
  type GeneratedDocument,
  type Jurisdiction,
  JURISDICTION_CONFIGS 
} from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getJurisdictionConfig(jurisdiction: Jurisdiction) {
  return JURISDICTION_CONFIGS[jurisdiction];
}

// ─── DATA TYPE LABELS (Comprehensive for all jurisdictions) ─────────────────

const dataTypeLabels: Record<string, string> = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone / Mobile Number',
  address: 'Postal / Billing Address',
  bankDetails: 'Bank Account & Financial Details',
  location: 'Geolocation Data',
  deviceInfo: 'Device Identifiers & Browser Data',
  cookies: 'Cookies & Tracking Identifiers',
  biometric: 'Biometric Data (fingerprints, face ID, voice)',
  healthData: 'Health & Medical Information',
  racialEthnic: 'Racial or Ethnic Origin',
  religiousBeliefs: 'Religious Beliefs or Philosophical Opinions',
  sexualOrientation: 'Sexual Orientation',
  tradeUnion: 'Trade Union Membership',
  geneticData: 'Genetic Data',
  politicalOpinions: 'Political Opinions',
  socialSecurity: 'Social Security / National Identification Numbers',
  preciseGeolocation: 'Precise Geolocation (within 1850 feet)',
};

const thirdPartyLabels: Record<string, string> = {
  googleAnalytics: 'Google Analytics',
  googleAds: 'Google Ads / AdSense',
  metaPixel: 'Meta (Facebook) Pixel',
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  paypal: 'PayPal',
  hotjar: 'Hotjar / Session Recording',
  intercom: 'Intercom / Live Chat',
  mailchimp: 'Mailchimp / Email Services',
  cloudflare: 'Cloudflare / CDN',
  aws: 'AWS / Cloud Hosting',
  other: 'Authorized Third-Party Service Providers',
};

const cookieTypeLabels: Record<string, string> = {
  essential: 'Essential Cookies (Strictly required for core website functionality and security)',
  analytics: 'Analytics Cookies (To evaluate traffic patterns and website usage metrics)',
  marketing: 'Marketing & Advertising Cookies (To serve tailored communications and offers)',
  functional: 'Functional Cookies (To retain your custom preferences and settings)',
  advertising: 'Advertising / Retargeting Cookies (To show relevant ads across websites)',
  socialMedia: 'Social Media Cookies (To enable social media features and sharing)',
};

const securityMeasureLabels: Record<string, string> = {
  ssl: 'SSL/TLS Encryption — Encrypted data transmission in transit using 256-bit TLS standards',
  encrypted: 'Encrypted Data Storage — Personal data encrypted at rest using AES-256 protocols',
  accessControls: 'Role-Based Access Controls (RBAC) — Strict least-privilege administrative access',
  twoFactor: 'Multi-Factor Authentication (MFA) — Mandatory secondary verification for internal access',
  auditLogs: 'Comprehensive Security Logs — Maintenance of tamper-evident access and audit trails',
  penetrationTesting: 'Regular Penetration Testing — Periodic vulnerability assessments by qualified security professionals',
  employeeTraining: 'Security Awareness Training — Regular training for all personnel handling personal data',
  dataBackup: 'Encrypted Backups & Disaster Recovery — Regular encrypted backups with tested recovery procedures',
  pseudonymization: 'Pseudonymization & Anonymization — Techniques to reduce identifiability of data subjects',
  dpoAppointed: 'Data Protection Officer Appointed — Dedicated DPO/DPL overseeing compliance',
};

const lawfulBasisLabels: Record<string, string> = {
  consent: 'Consent — You have given clear, informed consent to the processing',
  contract: 'Contract — Processing is necessary for a contract with you or pre-contractual steps',
  legalObligation: 'Legal Obligation — Processing is required to comply with applicable law',
  vitalInterests: 'Vital Interests — Processing is necessary to protect your life or someone else\'s life',
  publicTask: 'Public Task — Processing is necessary for a task carried out in the public interest',
  legitimateInterests: 'Legitimate Interests — Processing is necessary for our legitimate business interests (with appropriate safeguards)',
};

// ─── JURISDICTION-SPECIFIC SECTIONS ─────────────────────────────────────────

function generateIntroSection(data: FormData, jurisdiction: Jurisdiction): RenderSection {
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const config = getJurisdictionConfig(jurisdiction);
  
  let legalFramework: string;
  let additionalText: string = '';
  
  switch (jurisdiction) {
    case 'EU':
      legalFramework = `
        <ul>
          <li>The <strong>General Data Protection Regulation (EU) 2016/679 (GDPR)</strong>;</li>
          <li>The <strong>ePrivacy Directive (2002/58/EC)</strong> (as amended);</li>
          <li>The <strong>Digital Services Act (DSA)</strong>; and</li>
          <li>Applicable national data protection laws of EU Member States.</li>
        </ul>`;
      break;
      
    case 'US-CA':
      legalFramework = `
        <ul>
          <li>The <strong>California Consumer Privacy Act (CCPA)</strong> (Cal. Civ. Code §1798.100 et seq.);</li>
          <li>The <strong>California Privacy Rights Act (CPRA)</strong> (Proposition 24, as amended);</li>
          <li>The <strong>California Online Privacy Protection Act (CalOPPA)</strong>; and</li>
          <li>Other applicable California state privacy laws.</li>
        </ul>`;
      additionalText = `<p>This Privacy Policy also addresses our commitments under the <strong>California "Shine the Light" law</strong> (Civil Code §1798.83).</p>`;
      break;
      
    case 'US':
      legalFramework = `
        <ul>
          <li><strong>Federal Trade Commission (FTC) Act Section 5</strong> (prohibition on unfair/deceptive practices);</li>
          ${data.coppaApplies ? '<li>The <strong>Children\'s Online Privacy Protection Act (COPPA)</strong>;</li>' : ''}
          ${data.hipaaApplies ? '<li>The <strong>Health Insurance Portability and Accountability Act (HIPAA)</strong>;</li>' : ''}
          ${data.glbaApplies ? '<li>The <strong>Gramm-Leach-Bliley Act (GLBA)</strong>;</li>' : ''}
          <li>Applicable state privacy laws; and</li>
          <li>Industry-specific regulations.</li>
        </ul>`;
      break;
      
    case 'UK':
      legalFramework = `
        <ul>
          <li>The <strong>UK General Data Protection Regulation (UK GDPR)</strong>;</li>
          <li>The <strong>Data Protection Act 2018</strong>;</li>
          <li>The <strong>Privacy and Electronic Communications Regulations (PECR)</strong>; and</li>
          <li>The <strong>Information Commissioner\'s Office (ICO)</strong> guidance.</li>
        </ul>`;
      break;
      
    case 'GLOBAL':
      legalFramework = `
        <p>We operate globally and comply with multiple data protection frameworks depending on where you are located:</p>
        <ul>
          <li><strong>European Union:</strong> General Data Protection Regulation (GDPR), ePrivacy Directive</li>
          <li><strong>United States (California):</strong> CCPA, CPRA, CalOPPA</li>
          <li><strong>United Kingdom:</strong> UK GDPR, Data Protection Act 2018, PECR</li>
          <li><strong>India:</strong> Digital Personal Data Protection Act, 2023, IT Act, 2000</li>
          <li><strong>Other jurisdictions:</strong> Applicable local data protection laws</li>
        </ul>`;
      break;
      
    case 'IN':
    default:
      legalFramework = `
        <ul>
          <li>The <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>;</li>
          <li>The <strong>Information Technology Act, 2000</strong> (Sections 43A, 72A, and 79);</li>
          <li>The <strong>IT (Reasonable Security Practices and Procedures) Rules, 2011</strong>; and</li>
          <li>The <strong>IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>.</li>
        </ul>`;
      break;
  }
  
  return {
    title: '1. Introduction & Legal Framework',
    content: `
      <p>Welcome to <strong>${businessName}</strong> ("we," "us," or "our"). We operate <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a> (the "Website" or "Service") and are committed to protecting your personal data and respecting your privacy rights.</p>
      <p>${config.flag} <strong>Jurisdiction:</strong> This Privacy Policy is designed to comply with ${config.name} laws, specifically:</p>
      ${legalFramework}
      ${additionalText}
      <p>By accessing or utilizing our Website or services, you acknowledge that you have read, understood, and agree to the terms set out in this Privacy Policy.</p>
      <p><em>Last Updated:</em> <strong>${today()}</strong></p>`,
  };
}

function generateLawfulBasisSection(data: FormData, jurisdiction: Jurisdiction): RenderSection | null {
  if (!['EU', 'UK', 'GLOBAL'].includes(jurisdiction)) return null;
  
  const lawfulBasis = (data.lawfulBasis as string[]) || [];
  
  if (lawfulBasis.length === 0) return null;
  
  const basisList = lawfulBasis.map(b => `<li><strong>${escapeHtml(b)}:</strong> ${lawfulBasisLabels[b] || b}</li>`).join('\n      ');
  
  let specialCategoryContent = '';
  if (data.specialCategoryBasis && data.specialCategoryBasis !== 'none') {
    specialCategoryContent = `
      <h4>Special Category Data (Article 9 GDPR)</h4>
      <p>For processing that involves <strong>special categories of personal data</strong> (such as health data, biometric data, racial or ethnic origin, etc.), we rely on the following lawful basis:</p>
      <p><strong>${escapeHtml(data.specialCategoryBasis as string)}</strong></p>
      <p>Special category data requires additional protections and we have implemented appropriate safeguards to protect this sensitive information.</p>
    `;
  }
  
  return {
    title: '2. Lawful Basis for Processing (GDPR Article 6)',
    content: `
      <p>Under ${jurisdiction === 'UK' ? 'UK GDPR' : 'EU GDPR'} <strong>Article 6</strong>, we must have a valid legal basis before processing your personal data. Our lawful basis(es) for processing are:</p>
      <ul>
        ${basisList}
      </ul>
      ${specialCategoryContent}
      ${data.lawfulBasis?.includes('legitimateInterests') ? `
      <p><strong>Legitimate Interests Assessment (LIA):</strong> Where we rely on legitimate interests as our lawful basis, we have conducted and documented a Legitimate Interests Assessment balancing our interests against your rights and freedoms. You may request a copy of relevant LIAs by contacting our DPO.</p>
      ` : ''}`,
  };
}

function generateDataSubjectRightsSection(data: FormData, jurisdiction: Jurisdiction): RenderSection | null {
  const email = safeEmail((data.email as string) || '[Your Email]');
  const dpoEmail = safeEmail((data.dpoEmail as string) || email);
  const sarTime = escapeHtml((data.sarResponseTime as string) || '30 days');
  
  if (['EU', 'UK', 'GLOBAL'].includes(jurisdiction)) {
    const gdprRights = Array.isArray(data.gdprRights) ? data.gdprRights : [];
    
    return {
      title: `${jurisdiction === 'UK' ? '3' : ['IN', 'US-CA', 'US'].includes(jurisdiction) ? '2' : '3'}. Your Data Subject Rights (${jurisdiction === 'UK' ? 'UK GDPR' : 'GDPR'} Articles 15-22)`,
      content: `
        <p>You have the following rights regarding your personal data. To exercise any of these rights, please contact us at <a href="mailto:${dpoEmail}">${dpoEmail}</a>. We will respond to your request within <strong>${sarTime}</strong>.</p>
        
        ${gdprRights.includes('rightToAccess') ? `
        <h4>Right of Access (Subject Access Request)</h4>
        <p>You have the right to obtain confirmation as to whether we process your personal data and, where we do, access to that personal data and supplementary information. This is known as a Subject Access Request (SAR).</p>
        ` : ''}
        
        ${gdprRights.includes('rightToRectification') ? `
        <h4>Right to Rectification</h4>
        <p>You have the right to have inaccurate personal data corrected without delay. Taking into account the purposes of processing, you also have the right to have incomplete personal data completed.</p>
        ` : ''}
        
        ${gdprRights.includes('rightToErasure') ? `
        <h4>Right to Erasure ("Right to be Forgotten")</h4>
        <p>In certain circumstances, you have the right to request the deletion of your personal data. This right is not absolute and applies when, for example, the data is no longer necessary for the purposes it was collected, or you have withdrawn consent.</p>
        ` : ''}
        
        ${gdprRights.includes('rightToPortability') ? `
        <h4>Right to Data Portability</h4>
        <p>You have the right to receive your personal data in a structured, commonly used, machine-readable format and to transmit that data to another controller without hindrance.</p>
        ` : ''}
        
        ${gdprRights.includes('rightToRestrict') ? `
        <h4>Right to Restrict Processing</h4>
        <p>In certain circumstances, you have the right to restrict the processing of your personal data, for example where you contest the accuracy of the data.</p>
        ` : ''}
        
        ${gdprRights.includes('rightToObject') ? `
        <h4>Right to Object</h4>
        <p>You have the right to object at any time to processing based on legitimate interests or direct marketing. We will stop processing unless we can demonstrate compelling legitimate grounds.</p>
        ` : ''}
        
        ${gdprRights.includes('rightsRelatedToAutomatedDecisionMaking') ? `
        <h4>Rights Related to Automated Decision-Making</h4>
        <p>You have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning you or similarly significantly affects you.</p>
        ` : ''}
        
        <p>To exercise these rights, please contact our Data Protection Officer at <a href="mailto:${dpoEmail}">${dpoEmail}</a>. We may request identity verification before processing your request.</p>
      `,
    };
  }
  
  if (['US-CA', 'US', 'GLOBAL'].includes(jurisdiction)) {
    const ccpaRights = (data.ccpaRights as string[]) || [];
    const hasDoNotSellLink = data.doNotSellLink;
    const recognizesGPC = data.optOutPreferenceSignal;
    
    return {
      title: '2. Your California Privacy Rights (CCPA/CPRA)',
      content: `
        <p>If you are a California resident, you have specific rights under the <strong>California Consumer Privacy Act (CCPA)</strong> and <strong>California Privacy Rights Act (CPRA)</strong>:</p>
        
        ${ccpaRights.includes('rightToKnow') ? `
        <h4>Right to Know</h4>
        <p>You have the right to know what personal information we collect, use, disclose, and sell about you over the past 12 months.</p>
        ` : ''}
        
        ${ccpaRights.includes('rightToDelete') ? `
        <h4>Right to Delete</h4>
        <p>You have the right to request deletion of your personal information, subject to certain exceptions.</p>
        ` : ''}
        
        ${ccpaRights.includes('rightToOptOut') ? `
        <h4>Right to Opt-Out of Sale/Sharing</h4>
        <p>You have the right to direct us to not "sell" or "share" your personal information. ${hasDoNotSellLink ? 'We provide a <strong>"Do Not Sell or Share My Personal Information"</strong> link in the footer of our website.' : ''} ${recognizesGPC ? 'We also recognize browser-based Global Privacy Control (GPC) signals as valid opt-out requests.' : ''}</p>
        ` : ''}
        
        ${ccpaRights.includes('rightToCorrect') ? `
        <h4>Right to Correct Inaccurate Information</h4>
        <p>You have the right to request correction of inaccurate personal information that we hold about you, taking into account the nature of the personal information and the purposes of the processing.</p>
        ` : ''}
        
        ${ccpaRights.includes('rightToLimitUse') ? `
        <h4>Right to Limit Use of Sensitive Personal Information</h4>
        <p>You have the right to limit our use of your sensitive personal information to uses that are necessary for purposes that are permitted and compatible with the contexts in which you provided the information.</p>
        ` : ''}
        
        ${ccpaRights.includes('rightToNonDiscrimination') ? `
        <h4>Right to Non-Discrimination</h4>
        <p>We will not discriminate against you for exercising any of your CCPA rights. This means we will not deny you goods or services, charge you different prices, or provide you with a lower quality of goods or services.</p>
        ` : ''}
        
        <p>To exercise these rights, please contact us at <a href="mailto:${email}">${email}</a> or visit our privacy dashboard.</p>
      `,
    };
  }
  
  // India fallback
  const principalRights = (data.principalRights as string[]) || [];
  if (principalRights.length === 0) return null;
  
  return {
    title: '2. Your Rights as a Data Principal (DPDP Act)',
    content: `
      <p>Under the <strong>Digital Personal Data Protection Act, 2023</strong>, you have the following rights as a Data Principal:</p>
      <ul>
        ${principalRights.map(r => `<li>${escapeHtml(r)}</li>`).join('\n        ')}
      </ul>
      <p>To exercise these rights, please contact our Grievance Officer at <a href="mailto:${data.grievanceOfficerEmail || email}">${data.grievanceOfficerEmail || email}</a>.</p>
    `,
  };
}

function generateDataCollectionSection(data: FormData, jurisdiction: Jurisdiction): RenderSection {
  const dataTypes = (data.dataTypesCollected as string[]) || [];
  const config = getJurisdictionConfig(jurisdiction);
  
  let dataTypeList: string;
  if (dataTypes.length > 0) {
    dataTypeList = dataTypes.map(dt => `<li><strong>${dataTypeLabels[dt] || dt}:</strong> ${getDataPurpose(dt, jurisdiction)}</li>`).join('\n      ');
  } else {
    dataTypeList = getDefaultDataTypes(jurisdiction);
  }
  
  let sensitiveContent = '';
  if (data.collectsSensitiveData && ['EU', 'UK', 'US-CA', 'GLOBAL'].includes(jurisdiction)) {
    sensitiveContent = `
      <h4>Sensitive Personal Data</h4>
      <p>We collect the following categories of sensitive personal data:</p>
      <ul>
        ${(data.sensitiveDataTypes as string[] || []).map(dt => `<li>${dataTypeLabels[dt] || dt}</li>`).join('\n        ')}
      </ul>
      <p>Processing of sensitive personal data requires explicit consent and/or additional legal bases under ${config.primaryLaw}.</p>
    `;
  }
  
  return {
    title: ['IN'].includes(jurisdiction) ? '3. Personal Data We Collect' : ['US-CA', 'US'].includes(jurisdiction) ? '3. Information We Collect' : '3. Data We Collect',
    content: `
      <p>We collect various categories of ${['US-CA', 'US'].includes(jurisdiction) ? 'information' : 'personal data'} to provide and improve our services. The specific categories depend on how you interact with us.</p>
      
      <h4>Categories of ${['US-CA', 'US'].includes(jurisdiction) ? 'Personal Information' : 'Personal Data'} Collected</h4>
      <ul>
        ${dataTypeList}
      </ul>
      
      ${sensitiveContent}
      
      <h4>How We Collect Data</h4>
      <p>We collect ${['US-CA', 'US'].includes(jurisdiction) ? 'information' : 'personal data'} through the following methods:</p>
      <ul>
        <li><strong>Directly from you:</strong> When you fill out forms, create an account, make purchases, or communicate with us.</li>
        <li><strong>Automatically:</strong> When you browse our Website, including cookies, log files, and similar technologies.</li>
        <li><strong>From third parties:</strong> Such as analytics providers, advertising partners, and payment processors (${jurisdiction === 'EU' || jurisdiction === 'UK' ? ', subject to appropriate data processing agreements' : ''}).</li>
      </ul>
    `,
  };
}

function getDataPurpose(dataType: string, jurisdiction: Jurisdiction): string {
  const purposes: Record<string, string> = {
    name: 'To identify you and personalize your experience',
    email: 'To communicate with you, send updates, and process transactions',
    phone: 'To contact you regarding your account or for customer support',
    address: 'To deliver products/services and process payments',
    bankDetails: 'To process payments and issue refunds',
    location: 'To provide location-based services and analytics',
    deviceInfo: 'To ensure security and optimize your browsing experience',
    cookies: 'To track preferences, analyze usage, and serve relevant content',
    biometric: 'For authentication and identity verification (with explicit consent)',
    healthData: 'Only if you provide it voluntarily for specific health-related services',
    racialEthnic: 'For diversity and inclusion initiatives (with explicit consent)',
    religiousBeliefs: 'For accommodation requests (with explicit consent)',
    sexualOrientation: 'For non-discrimination compliance (with explicit consent)',
    tradeUnion: 'For employment-related purposes (where applicable)',
    geneticData: 'For specialized health services (with explicit consent and additional safeguards)',
    politicalOpinions: 'Never collected unless required by law',
    socialSecurity: 'For tax reporting and identity verification (where legally required)',
    preciseGeolocation: 'For location-based services (with explicit consent)',
  };
  return purposes[dataType] || 'For the purposes described in this Privacy Policy';
}

function getDefaultDataTypes(jurisdiction: Jurisdiction): string {
  const common = `
        <li><strong>Identifiers:</strong> Name, email address, phone number, postal address</li>
        <li><strong>Commercial information:</strong> Purchase history, payment method details</li>
        <li><strong>Internet activity:</strong> Pages viewed, links clicked, search terms</li>
        <li><strong>Geolocation data:</strong> Approximate location based on IP address</li>
        <li><strong>Device identifiers:</strong> Browser type, operating system, device model</li>`;
  
  if (jurisdiction === 'EU' || jurisdiction === 'UK') {
    return common + `
        <li><strong>Special category data (if provided):</strong> With your explicit consent</li>`;
  }
  
  if (jurisdiction === 'US-CA' || jurisdiction === 'US') {
    return common;
  }
  
  return common;
}

function generateUseOfDataSection(data: FormData, jurisdiction: Jurisdiction): RenderSection {
  const purposes = (data.purposesOfProcessing as string[]) || [];
  const config = getJurisdictionConfig(jurisdiction);
  
  let purposeList: string;
  if (purposes.length > 0) {
    purposeList = purposes.map(p => `<li>${escapeHtml(p)}</li>`).join('\n      ');
  } else {
    purposeList = getDefaultPurposes(jurisdiction);
  }
  
  return {
    title: ['IN'].includes(jurisdiction) ? '4. Purposes of Processing' : ['US-CA', 'US'].includes(jurisdiction) ? '4. Use of Personal Information' : '4. Purposes of Data Processing',
    content: `
      <p>We use your ${['US-CA', 'US'].includes(jurisdiction) ? 'personal information' : 'personal data'} for the following purposes:</p>
      <ul>
        ${purposeList}
      </ul>
      ${jurisdiction === 'EU' || jurisdiction === 'UK' ? `
      <p>Our processing is based on the lawful bases outlined in Section 2 above. Where we rely on consent, you have the right to withdraw it at any time.</p>
      ` : ''}
      ${jurisdiction === 'US-CA' || jurisdiction === 'US' ? `
      <p>We will not sell or share your personal information for valuable consideration beyond what is disclosed in this policy.</p>
      ` : ''}
    `,
  };
}

function getDefaultPurposes(jurisdiction: Jurisdiction): string {
  return `
        <li>To provide, maintain, and improve our services</li>
        <li>To process transactions and send related information</li>
        <li>To respond to your inquiries and provide customer support</li>
        <li>To send administrative information and updates</li>
        <li>To monitor and analyze usage trends and preferences</li>
        <li>To detect, prevent, and address technical issues or fraudulent activity</li>
        <li>To comply with legal obligations${jurisdiction === 'EU' || jurisdiction === 'UK' ? ' and exercise of legitimate interests' : ''}</li>
        <li>To protect the rights, privacy, safety, or property of our users or others</li>`;
}

function generateSharingSection(data: FormData, jurisdiction: Jurisdiction): RenderSection {
  const thirdParties = (data.thirdPartySharing as string[]) || [];
  
  let sharingCategories: string;
  if (thirdParties.length > 0) {
    sharingCategories = thirdParties.map(tp => {
      const desc = getThirdPartyDescription(tp, jurisdiction);
      return `<li><strong>${thirdPartyLabels[tp] || tp}:</strong> ${desc}</li>`;
    }).join('\n      ');
  } else {
    sharingCategories = getDefaultThirdParties(jurisdiction);
  }
  
  let saleSharingContent = '';
  if ((jurisdiction === 'US-CA' || jurisdiction === 'US' || jurisdiction === 'GLOBAL') && data.sellsData) {
    saleSharingContent = `
      <h4>Sale and Sharing of Personal Information (CCPA/CPRA)</h4>
      <p>We ${data.sellsData === true ? '<strong>DO</strong>' : 'do not'} "sell" or "share" personal information as defined by the CCPA/CPRA.</p>
      ${data.sellsData === true ? `
      <p>The categories of third parties to which we may sell or share personal information include:</p>
      <ul>
        ${(data.saleCategories as string[] || []).map(c => `<li>${escapeHtml(c)}</li>`).join('\n        ')}
      </ul>
      <p><strong>Your Rights:</strong> You have the right to opt-out of the sale or sharing of your personal information. See Section 2 for instructions on how to exercise this right.</p>
      ` : ''}
    `;
  }
  
  return {
    title: ['IN'].includes(jurisdiction) ? '5. Sharing of Personal Data' : ['US-CA', 'US'].includes(jurisdiction) ? '5. Sharing of Personal Information' : '5. Data Sharing & Disclosures',
    content: `
      <p>We may share your ${['US-CA', 'US'].includes(jurisdiction) ? 'personal information' : 'personal data'} with the following categories of third parties:</p>
      <ul>
        ${sharingCategories}
      </ul>
      
      ${saleSharingContent}
      
      ${jurisdiction === 'EU' || jurisdiction === 'UK' ? `
      <h4>International Transfers</h4>
      <p>As ${jurisdiction === 'UK' ? 'a UK-based' : 'an EU-based'} service, some of your personal data may be transferred to and processed in countries outside the ${jurisdiction === 'UK' ? 'United Kingdom' : 'European Economic Area (EEA)'}. We ensure appropriate safeguards are in place for such transfers, including:</p>
      <ul>
        <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
        ${jurisdiction === 'EU' ? '<li>Adequacy decisions for countries deemed to provide equivalent protection</li>' : ''}
        <li>Binding Corporate Rules (BCRs) where applicable</li>
        <li>Consent where specifically requested</li>
      </ul>
      <p>You may request a list of the countries to which we transfer data and the safeguards in place by contacting our DPO.</p>
      ` : ''}
      
      <h4>Legal Requirements for Disclosure</h4>
      <p>We may also disclose your information where required by law, such as:</p>
      <ul>
        <li>In response to a court order, subpoena, or regulatory requirement</li>
        <li>To protect our rights, property, or safety, or that of our users or others</li>
        <li>In connection with a corporate merger, acquisition, or sale of assets</li>
        ${jurisdiction === 'IN' ? '<li>To the Board of India as required under the DPDP Act and IT Act</li>' : ''}
      </ul>
    `,
  };
}
function getThirdPartyDescription(thirdParty: string, jurisdiction: Jurisdiction): string {
  const descriptions: Record<string, string> = {
    googleAnalytics: 'To analyze website traffic and usage patterns',
    googleAds: 'To serve targeted advertisements and measure ad performance',
    metaPixel: 'To measure ad effectiveness, build audiences, and improve our products',
    razorpay: 'To process secure online payments',
    stripe: 'To process secure online payments',
    paypal: 'To process payments and manage transactions',
    hotjar: 'To understand user behavior through heatmaps and session recordings',
    intercom: 'To provide live chat support and customer engagement',
    mailchimp: 'To send marketing emails and newsletters',
    cloudflare: 'To provide CDN services, DDoS protection, and security',
    aws: 'To host our infrastructure and cloud services',
    other: 'Other service providers who assist in operating our business',
  };
  return descriptions[thirdParty] || 'To provide services on our behalf';
}

function getDefaultThirdParties(jurisdiction: Jurisdiction): string {
  return `
        <li><strong>Service Providers:</strong> Companies that help us operate our business (hosting, payment processing, analytics, email delivery)</li>
        <li><strong>Professional Advisors:</strong> Lawyers, accountants, and consultants who assist us in running our business</li>
        <li><strong>Legal Authorities:</strong> When required by law, court order, or regulatory requirement</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
        ${jurisdiction === 'EU' || jurisdiction === 'UK' ? '<li><strong>European/International Partners:</strong> With appropriate safeguards in place (SCCs, adequacy decisions)</li>' : ''}
        ${jurisdiction === 'IN' ? '<li><strong>Government Authorities:</strong> As required under the DPDP Act and other applicable laws</li>' : ''}`;
}

function generateCookiesSection(data: FormData, jurisdiction: Jurisdiction): RenderSection {
  const cookieTypes = (data.cookieTypesUsed as string[]) || [];
  const config = getJurisdictionConfig(jurisdiction);
  
  let cookieList: string;
  if (cookieTypes.length > 0) {
    cookieList = cookieTypes.map(ct => `<li><strong>${ct}:</strong> ${cookieTypeLabels[ct] || ct}</li>`).join('\n      ');
  } else {
    cookieList = getDefaultCookieTypes(jurisdiction);
  }
  
  return {
    title: ['IN'].includes(jurisdiction) ? '6. Cookies & Tracking Technologies' : '6. Cookies & Tracking',
    content: `
      <p>We use cookies and similar tracking technologies to collect and store information about your visit. A cookie is a small text file that is stored on your device.</p>
      
      <h4>Types of Cookies We Use</h4>
      <ul>
        ${cookieList}
      </ul>
      
      <h4>Managing Cookies</h4>
      ${jurisdiction === 'EU' || jurisdiction === 'UK' ? `
      <p>Prior to placing non-essential cookies on your device, we will obtain your consent through our cookie banner. You can manage your cookie preferences at any time by:</p>
      <ul>
        <li>Clicking the "Cookie Settings" link in our cookie banner</li>
        <li>Adjusting your browser settings to block or delete cookies</li>
        <li>Using browser extensions that manage cookie preferences</li>
      </ul>
      <p>Please note that disabling essential cookies may affect the functionality of our Website.</p>
      ` : `
      <p>You can control cookies through your browser settings. Most browsers allow you to:</p>
      <ul>
        <li>View what cookies are stored on your device</li>
        <li>Delete existing cookies individually or all at once</li>
        <li>Block third-party cookies</li>
        <li>Notify you when a cookie is set</li>
      </ul>
      <p>For more information about controlling cookies, visit <a href="https://www.allaboutcookies.org/manage-cookies/" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.</p>
      `}
      
      ${jurisdiction === 'EU' || jurisdiction === 'UK' ? `
      <h4>ePrivacy Compliance</h4>
      <p>In addition to ${config.primaryLaw}, our use of cookies complies with the <strong>ePrivacy Directive</strong> (${jurisdiction === 'UK' ? 'implemented via PECR' : '2002/58/EC'}). We respect your Do Not Track (DNT) signal, though many third-party services may not recognize it.</p>
      ` : ''}
      
      ${jurisdiction === 'US-CA' || jurisdiction === 'US' ? `
      <h4>Do Not Track Signals</h4>
      <p>Some browsers transmit Do Not Track (DNT) signals. However, there is no consistent industry standard for how websites should respond to DNT signals, and most third-party services do not currently respond to DNT.</p>
      ${data.optOutPreferenceSignal ? '<p>We recognize Global Privacy Control (GPC) signals as valid opt-out requests under the CCPA/CPRA.</p>' : ''}
      ` : ''}
    `,
  };
}

function getDefaultCookieTypes(jurisdiction: Jurisdiction): string {
  return `
        <li><strong>Essential Cookies:</strong> Required for basic site functionality (authentication, security)</li>
        <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site</li>
        <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
        <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>`;
}

function generateSecuritySection(data: FormData, jurisdiction: Jurisdiction): RenderSection {
  const measures = (data.securityMeasures as string[]) || [];
  const config = getJurisdictionConfig(jurisdiction);
  
  let measureList: string;
  if (measures.length > 0) {
    measureList = measures.map(m => `<li>${securityMeasureLabels[m] || m}</li>`).join('\n      ');
  } else {
    measureList = getDefaultSecurityMeasures(jurisdiction);
  }
  
  return {
    title: ['IN'].includes(jurisdiction) ? '7. Data Security' : '7. Data Security Measures',
    content: `
      <p>We implement appropriate technical and organizational security measures to protect your ${['US-CA', 'US'].includes(jurisdiction) ? 'personal information' : 'personal data'} against unauthorized access, alteration, disclosure, or destruction. These measures are designed to meet the requirements of ${config.primaryLaw} and industry best practices.</p>
      
      <h4>Security Measures Implemented</h4>
      <ul>
        ${measureList}
      </ul>
      
      <h4>Data Breach Notification</h4>
      ${jurisdiction === 'EU' || jurisdiction === 'UK' ? `
      <p>In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the supervisory authority (${jurisdiction === 'UK' ? 'ICO' : 'relevant DPA'}) within <strong>72 hours</strong> of becoming aware of the breach, unless the breach is unlikely to result in a risk. We will also notify you without undue delay if the breach results in a high risk to your rights and freedoms.</p>
      ` : jurisdiction === 'IN' ? `
      <p>In the event of a personal data breach, we will notify the Board of India and affected Data Principals as required under Section 11 of the DPDP Act, 2023.</p>
      ` : jurisdiction === 'US-CA' ? `
      <p>In the event of a data breach involving unencrypted personal information, we will notify affected California residents as required by California Civil Code §1798.82.</p>
      ` : `
      <p>In the event of a security breach, we will take reasonable steps to notify affected users and relevant authorities as required by applicable law.</p>
      `}
      
      <p>While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.</p>
    `,
  };
}

function getDefaultSecurityMeasures(jurisdiction: Jurisdiction): string {
  return `
        <li>SSL/TLS encryption for data in transit</li>
        <li>Encrypted storage for sensitive data at rest</li>
        <li>Access controls and authentication mechanisms</li>
        <li>Regular security assessments and penetration testing</li>
        <li>Employee training on data protection practices</li>
        <li>Incident response and business continuity procedures</li>`;
}

function generateRetentionSection(data: FormData, jurisdiction: Jurisdiction): RenderSection {
  const retentionPeriod = escapeHtml((data.retentionPeriod as string) || 'as long as necessary to fulfill the purposes outlined in this Privacy Policy');
  
  return {
    title: ['IN'].includes(jurisdiction) ? '8. Data Retention' : '8. Data Retention Period',
    content: `
      <p>We retain your ${['US-CA', 'US'].includes(jurisdiction) ? 'personal information' : 'personal data'} for ${retentionPeriod}.</p>
      
      <h4>Retention Criteria</h4>
      <p>We consider the following factors when determining retention periods:</p>
      <ul>
        <li>The purposes for which we collected the data (including any ongoing legal, accounting, or reporting requirements)</li>
        <li>Whether we have a legal obligation to retain the data</li>
        <li>Whether any disputes or claims are pending or reasonably anticipated</li>
        ${jurisdiction === 'EU' || jurisdiction === 'UK' ? '<li>Whether retention is necessary to establish, exercise, or defend legal claims</li>' : ''}
        ${jurisdiction === 'IN' ? '<li>Whether retention is necessary for compliance with the DPDP Act</li>' : ''}
      </ul>
      
      <p>When data is no longer needed, we will securely delete or anonymize it, unless preservation is required by law.</p>
    `,
  };
}

function generateDPOSection(data: FormData, jurisdiction: Jurisdiction): RenderSection | null {
  // Only for EU/UK/GLOBAL
  if (!['EU', 'UK', 'GLOBAL'].includes(jurisdiction)) return null;
  
  const dpoName = escapeHtml((data.dpoName as string) || '[Data Protection Officer Name]');
  const dpoEmail = safeEmail((data.dpoEmail as string) || '[DPO Email]');
  const dpoAddress = escapeHtml((data.dpoAddress as string) || '[DPO Address]');
  const dpoPhone = escapeHtml((data.dpoPhone as string) || '[DPO Phone]');
  
  return {
    title: '9. Data Protection Officer',
    content: `
      <p>${jurisdiction === 'UK' ? 'Under UK GDPR Article 37 and the Data Protection Act 2018' : 'Under GDPR Article 37'}, we have appointed a Data Protection Officer (DPO) to oversee our data protection strategy and ensure compliance with ${jurisdiction === 'UK' ? 'UK data protection laws' : 'EU data protection laws'}.</p>
      
      <h4>Contact Our DPO</h4>
      <p>
        <strong>Name:</strong> ${dpoName}<br/>
        <strong>Email:</strong> <a href="mailto:${dpoEmail}">${dpoEmail}</a><br/>
        <strong>Address:</strong> ${dpoAddress}<br/>
        <strong>Phone:</strong> ${dpoPhone}
      </p>
      
      <h4>DPO Responsibilities</h4>
      <ul>
        <li>Advising on data protection obligations and GDPR/UK GDPR compliance</li>
        <li>Monitoring compliance with ${jurisdiction === 'UK' ? 'the DPA 2018 and UK GDPR' : 'the GDPR'}, this Privacy Policy, and internal policies</li>
        <li>Cooperating with the ${jurisdiction === 'UK' ? 'Information Commissioner\'s Office (ICO)' : 'Supervisory Authority'} and serving as point of contact</li>
        <li>Maintaining records of processing activities (Article 30)</li>
        <li>Advising on Data Protection Impact Assessments (DPIAs)</li>
        <li>Training staff on data protection matters</li>
      </ul>
      
      <p>You may contact our DPO directly with any questions or concerns regarding our data protection practices.</p>
    `,
  };
}

function generateGrievanceOfficerSection(data: FormData, jurisdiction: Jurisdiction): RenderSection | null {
  // Only for IN/GLOBAL
  if (!['IN', 'GLOBAL'].includes(jurisdiction)) return null;
  
  const goName = escapeHtml((data.grievanceOfficerName as string) || '[Grievance Officer Name]');
  const goEmail = safeEmail((data.grievanceOfficerEmail as string) || '[Grievance Officer Email]');
  const goAddress = escapeHtml((data.grievanceOfficerAddress as string) || '[Grievance Officer Address]');
  const goPhone = escapeHtml((data.grievanceOfficerPhone as string) || '[Grievance Officer Phone]');
  
  return {
    title: '10. Grievance Officer (India DPDP Act)',
    content: `
      <p>Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, we have appointed a Grievance Officer to handle your complaints and grievances regarding personal data processing.</p>
      
      <h4>Contact Our Grievance Officer</h4>
      <p>
        <strong>Name:</strong> ${goName}<br/>
        <strong>Email:</strong> <a href="mailto:${goEmail}">${goEmail}</a><br/>
        <strong>Address:</strong> ${goAddress}<br/>
        <strong>Phone:</strong> ${goPhone}
      </p>
      
      <h4>Grievance Redressal Process</h4>
      <ol>
        <li>Submit your grievance in writing to the Grievance Officer at the contact details above</li>
        <li>We will acknowledge receipt within <strong>48 hours</strong></li>
        <li>We will investigate and provide a resolution within <strong>30 days</strong></li>
        <li>If you are not satisfied, you may appeal to the <strong>Board of India</strong></li>
      </ol>
      
      <p>The Grievance Officer is responsible for:</p>
      <ul>
        <li>Receiving and addressing grievances from Data Principals</li>
        <li>Coordinating with the Board of India as required</li>
        <li>Ensuring timely redressal of complaints</li>
        <li>Maintaining records of grievances and their resolutions</li>
      </ul>
    `,
  };
}

function generateUKSpecificSection(data: FormData, jurisdiction: Jurisdiction): RenderSection | null {
  if (jurisdiction !== 'UK' && jurisdiction !== 'GLOBAL') return null;
  
  return {
    title: '11. UK-Specific Provisions',
    content: `
      <h4>International Data Transfers Post-Brexit</h4>
      <p>Following the UK's departure from the EU, personal data flows between the UK and the EEA are governed by the <strong>UK-US Data Bridge</strong> and the <strong>EU-UK Trade and Cooperation Agreement</strong>. We ensure that transfers to countries outside the UK benefit from appropriate safeguards.</p>
      
      <h4>ICO Registration</h4>
      <p>We are registered with the Information Commissioner's Office (ICO) as a data controller. Our registration number and details are available on the ICO's public register.</p>
      
      <h4>PECR Compliance</h4>
      <p>Our use of cookies and electronic communications complies with the <strong>Privacy and Electronic Communications Regulations (PECR)</strong>. We obtain consent before storing or accessing information on your device (except for essential cookies).</p>
      
      <h4>Employment Data</h4>
      <p>If you are an employee or job applicant, additional provisions of the UK GDPR and employment law apply to your personal data. We process employment data for HR administration, payroll, legal obligations, and legitimate interests.</p>
    `,
  };
}

// ─── MAIN GENERATOR FUNCTION ───────────────────────────────────────────────

export function generateMultiJurisdictionPrivacyPolicy(data: FormData, jurisdiction: Jurisdiction): GeneratedDocument {
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const config = getJurisdictionConfig(jurisdiction);
  
  // Build sections array
  const sections: RenderSection[] = [];
  
  // 1. Introduction (always first)
  sections.push(generateIntroSection(data, jurisdiction));
  
  // 2. Lawful Basis (EU/UK/GLOBAL)
  const lawfulBasisSection = generateLawfulBasisSection(data, jurisdiction);
  if (lawfulBasisSection) sections.push(lawfulBasisSection);
  
  // 3. Data Subject Rights
  const rightsSection = generateDataSubjectRightsSection(data, jurisdiction);
  if (rightsSection) sections.push(rightsSection);
  
  // 4. Data Collection
  sections.push(generateDataCollectionSection(data, jurisdiction));
  
  // 5. Use/Purposes
  sections.push(generateUseOfDataSection(data, jurisdiction));
  
  // 6. Sharing
  sections.push(generateSharingSection(data, jurisdiction));
  
  // 7. Cookies
  sections.push(generateCookiesSection(data, jurisdiction));
  
  // 8. Security
  sections.push(generateSecuritySection(data, jurisdiction));
  
  // 9. Retention
  sections.push(generateRetentionSection(data, jurisdiction));
  
  // 10. DPO (EU/UK)
  const dpoSection = generateDPOSection(data, jurisdiction);
  if (dpoSection) sections.push(dpoSection);
  
  // 11. Grievance Officer (India)
  const grievanceSection = generateGrievanceOfficerSection(data, jurisdiction);
  if (grievanceSection) sections.push(grievanceSection);
  
  // 12. UK Specific
  const ukSection = generateUKSpecificSection(data, jurisdiction);
  if (ukSection) sections.push(ukSection);
  
  // 13. Contact (always last)
  sections.push({
    title: 'Contact Us',
    content: `
      <p>For questions about this Privacy Policy or our data practices, please contact:</p>
      <p>
        <strong>${businessName}</strong><br/>
        Email: <a href="mailto:${email}">${email}</a><br/>
        Website: <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a>
      </p>
      ${jurisdiction === 'EU' || jurisdiction === 'UK' || jurisdiction === 'GLOBAL' ? 
        `<p>Or contact our Data Protection Officer: <a href="mailto:${data.dpoEmail || email}">${data.dpoEmail || email}</a></p>` : 
        ''
      }
      ${jurisdiction === 'IN' || jurisdiction === 'GLOBAL' ?
        `<p>Or contact our Grievance Officer: <a href="mailto:${data.grievanceOfficerEmail || email}">${data.grievanceOfficerEmail || email}</a></p>` :
        ''
      }
    `,
  });
  
  // Generate HTML
  const html = renderDocument({
  subtitle: `${config.name} Compliance (${config.primaryLaw})`,
  sections,
  metadata: {
    businessName,
    website: websiteUrl,
    jurisdiction,
    lastUpdated: today(),
  },
});
  
  // Get relevant laws for compliance info
  const relevantLaws = LAW_REGISTRY[config.authority.split(',')[0]] || [];
  
  return {
    html,
    text: html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    title: `Privacy Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: today(),
      jurisdiction,
    },
  };
}