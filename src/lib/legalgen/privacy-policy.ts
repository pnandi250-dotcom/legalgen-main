// src/lib/legalgen/privacy-policy.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generatePrivacyPolicy(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const phone = escapeHtml((data.phone as string) || '');
  const address = escapeHtml((data.address as string) || '');
  const country = escapeHtml((data.country as string) || 'India');
  const entityType = escapeHtml((data.entityType as string) || '');
  const industry = escapeHtml((data.industry as string) || 'general');
  const targetAudience = escapeHtml((data.targetAudience as string) || 'India');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');
  const dataRetention = escapeHtml((data.dataRetention as string) || 'as long as necessary to fulfill the operational and legal purposes specified herein');
  const grievanceOfficerName = escapeHtml((data.grievanceOfficerName as string) || businessName);
  const grievanceOfficerEmail = safeEmail((data.grievanceOfficerEmail as string) || email);
  const grievanceOfficerPhone = escapeHtml((data.grievanceOfficerPhone as string) || phone);

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  const usesCookies = !!data.usesCookies;
  const collectsPayment = !!data.collectsPayment;
  const hasAccounts = !!data.hasAccounts;
  const sellsProducts = !!data.sellsProducts;
  const hasNewsletter = !!data.hasNewsletter;
  const sharesData = !!data.sharesData;
  const childrenUnder13 = !!data.childrenUnder13;
  const childrenUnder18 = !!data.childrenUnder18;
  const usesAi = !!data.usesAi;
  const hasSocialLogin = !!data.hasSocialLogin;
  const storesIpAddress = !!data.storesIpAddress;
  const dataBreachProcess = !!data.dataBreachProcess;
  const isDataFiduciary = !!data.isDataFiduciary;
  const hasMobileApp = !!data.hasMobileApp;

  // ─── 3. ARRAY FIELDS ──────────────────────────────────────────────────
  const dataTypes = (data.dataTypes as string[]) || ['name', 'email'];
  const cookieTypes = (data.cookieTypes as string[]) || [];
  const thirdParties = (data.thirdParties as string[]) || [];
  const paymentProviders = (data.paymentProviders as string[]) || [];
  const dataSecurityMeasures = (data.dataSecurityMeasures as string[]) || [];

  // ─── 4. LABEL LOOKUPS ──────────────────────────────────────────────────
  const dataTypeLabels: Record<string, string> = {
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone / Mobile Number',
    address: 'Postal / Billing Address',
    dateOfBirth: 'Date of Birth',
    governmentId: 'Government-issued Identification (PAN, Passport, etc. as permitted by law)',
    bankDetails: 'Bank Account & Financial Details',
    photos: 'Photographs or Profile Images',
    location: 'Geolocation Data',
    deviceInfo: 'Device Identifiers & Browser Data',
  };

  const thirdPartyLabels: Record<string, string> = {
    googleAnalytics: 'Google Analytics',
    googleAds: 'Google Ads',
    facebookPixel: 'Facebook/Meta Pixel',
    hotjar: 'Hotjar',
    intercom: 'Intercom',
    zendesk: 'Zendesk',
    mailchimp: 'Mailchimp',
    sendgrid: 'SendGrid',
    razorpay: 'Razorpay',
    stripe: 'Stripe',
    paypal: 'PayPal',
    other: 'Authorized Third-Party Service Providers',
  };

  const cookieTypeLabels: Record<string, string> = {
    essential: 'Essential Cookies (Strictly required for core website functionality and security)',
    analytics: 'Analytics Cookies (To evaluate traffic patterns and website usage metrics)',
    marketing: 'Marketing & Advertising Cookies (To serve tailored communications and offers)',
    functional: 'Functional Cookies (To retain your custom preferences and settings)',
    performance: 'Performance Cookies (To optimize load speed and user interface responsiveness)',
  };

  const securityMeasureLabels: Record<string, string> = {
    ssl: 'SSL/TLS Encryption — Encrypted data transmission in transit using 256-bit TLS standards',
    encrypted: 'Encrypted Data Storage — Personal data encrypted at rest using AES-256 protocols',
    accessControls: 'Role-Based Access Controls (RBAC) — Strict least-privilege administrative access',
    auditLogs: 'Comprehensive Security Logs — Maintenance of tamper-evident access and audit trails',
    twoFactor: 'Multi-Factor Authentication (MFA) — Mandatory secondary verification for internal access',
    pentest: 'Regular Security Audits — Periodic vulnerability testing and risk assessments',
  };

  const paymentLabels: Record<string, string> = {
    razorpay: 'Razorpay',
    stripe: 'Stripe',
    paypal: 'PayPal',
    cashOnDelivery: 'Cash on Delivery (COD)',
    upi: 'Unified Payments Interface (UPI)',
    bankTransfer: 'Bank Transfer (NEFT / RTGS / IMPS)',
    phonePe: 'PhonePe',
    paytm: 'Paytm',
  };

  // ─── 5. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction
  sections.push({
    title: '1. Introduction & Statutory Framework',
    content: `
      <p>Welcome to <strong>${businessName}</strong>${entityType ? ` (${entityType === 'pvt-ltd' ? 'a Private Limited Company' : entityType === 'llp' ? 'a Limited Liability Partnership' : entityType === 'sole-prop' ? 'a Sole Proprietorship' : entityType === 'partnership' ? 'a Partnership Firm' : entityType === 'opc' ? 'a One Person Company' : 'an entity'})` : ''} ("we," "us," or "our"). We operate <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a> (the "Website") and are committed to protecting your personal data and respecting your privacy rights.</p>
      <p>This Privacy Policy is formulated in statutory compliance with Indian privacy regulations, including:</p>
      <ul>
        <li>The <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>;</li>
        <li>The <strong>Information Technology Act, 2000</strong> (Sections 43A, 72A, and 79);</li>
        <li>The <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>; and</li>
        <li>The <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>.</li>
      </ul>
      <p>By accessing or utilizing our Website or services, you acknowledge that you have read and understood the provisions set out in this Privacy Policy.</p>`,
  });

  // 2. Notice and Consent (DPDP Act 2023 Mandatory Notice)
  sections.push({
    title: '2. Notice and Consent Mechanism',
    content: `
      <p>Under <strong>Section 5 and Section 6 of the Digital Personal Data Protection Act, 2023</strong>, any request for your personal data is accompanied by a clear, itemized notice. By granting consent, you authorize us to process your personal data solely for the specified, lawful purposes outlined at the point of collection.</p>
      <p>Your consent is free, specific, informed, unconditional, and unambiguous. You reserve the absolute right to withdraw your consent at any time with future effect by emailing us at <a href="mailto:${email}">${email}</a>.</p>`,
  });

  // 3. Information We Collect
  const dataCollectedList = dataTypes.map((d) => `<li>${escapeHtml(dataTypeLabels[d] || d)}</li>`).join('\n      ');
  sections.push({
    title: '3. Information We Collect',
    content: `
      <p>We collect personal data directly from you when voluntarily submitted, as well as automatically through automated technical logs. The categories of data collected include:</p>
      <ul>
        ${dataCollectedList}
        ${storesIpAddress ? '<li>IP address, browser user-agent, and technical network logs</li>' : ''}
        ${collectsPayment ? '<li>Transaction references and billing confirmation status</li>' : ''}
      </ul>
      <p>Data collection occurs through interactions such as:</p>
      <ul>
        ${hasAccounts ? '<li>Account creation, identity verification, and profile management</li>' : ''}
        ${sellsProducts ? '<li>Order placement, checkout processing, and product delivery</li>' : ''}
        ${hasNewsletter ? '<li>Subscription to updates, newsletters, or promotional announcements</li>' : ''}
        <li>Customer support inquiries, contact forms, or direct correspondence</li>
      </ul>`,
  });

  // 4. Purpose of Processing
  sections.push({
    title: '4. Purpose of Processing Personal Data',
    content: `
      <p>We process your personal data exclusively for lawful purposes directly connected to our operational activities, including:</p>
      <ul>
        <li>Fulfilling services, managing user requests, and delivering operational features;</li>
        ${sellsProducts ? '<li>Processing purchase orders, tax invoicing, shipping logistics, and customer refunds;</li>' : ''}
        ${hasAccounts ? '<li>Authenticating user credentials and safeguarding account access;</li>' : ''}
        ${hasNewsletter ? '<li>Sending administrative notifications and opt-in promotional materials;</li>' : ''}
        <li>Detecting, preventing, and mitigating fraudulent transactions or cybersecurity threats;</li>
        <li>Complying with statutory tax, legal, regulatory, and audit obligations under Indian law.</li>
      </ul>`,
  });

  // 5. Payment Processing (conditional)
  if (collectsPayment) {
    const providerNames = paymentProviders.map((p) => escapeHtml(paymentLabels[p] || p)).join(', ');
    sections.push({
      title: '5. Payment Information & Financial Compliance',
      content: `
        <p>For financial transactions on our Website, all payments are routed through PCI-DSS compliant third-party payment gateways${providerNames ? ` (including <strong>${providerNames}</strong>)` : ''}.</p>
        <p><strong>Strict Storage Mandate:</strong> We do not store complete payment card numbers, CVVs, or sensitive banking passwords on our infrastructure. All payment processing strictly adheres to the <strong>Reserve Bank of India (RBI) Payment Aggregator Guidelines</strong>, PCI-DSS compliance frameworks, and the <strong>Payment and Settlement Systems Act, 2007</strong>.</p>`,
    });
  }

  // 6. User Accounts (conditional)
  if (hasAccounts) {
    sections.push({
      title: '6. User Account Management & Security',
      content: `
        <p>When you maintain an account on our platform, your credential data is protected using cryptographic password hashing (bcrypt/Argon2).${hasSocialLogin ? ' If you authenticate via Single Sign-On (SSO) or social login providers, we receive verified basic profile metadata directly from the identity provider.' : ''}</p>
        <p>You remain responsible for maintaining the confidentiality of your authentication details and must notify us immediately of any unauthorized access.</p>`,
    });
  }

  // 7. Data Retention & Erasure
  sections.push({
    title: '7. Data Retention and Erasure Policy',
    content: `
      <p>In adherence to <strong>Section 8(7) of the DPDP Act, 2023</strong>, we retain personal data only for as long as necessary to satisfy the purpose for which it was collected, or to fulfill statutory obligations under tax and corporate laws.</p>
      <p>Your personal data will be retained for <strong>${dataRetention}</strong>. Upon the expiry of the relevant retention threshold or receipt of a valid erasure request, your personal data will be permanently purged or anonymized using secure data destruction protocols.</p>`,
  });

  // 8. Security Measures (conditional)
  if (dataSecurityMeasures.length > 0) {
    const securityList = dataSecurityMeasures.map((m) => `<li>${escapeHtml(securityMeasureLabels[m] || m)}</li>`).join('\n        ');
    sections.push({
      title: '8. Reasonable Security Practices & Safeguards',
      content: `
        <p>In accordance with <strong>Section 43A of the Information Technology Act, 2000</strong> and <strong>Section 8(5) of the DPDP Act, 2023</strong>, we maintain robust organizational, physical, and technical safeguards:</p>
        <ul>${securityList}</ul>`,
    });
  }

  // 9. Data Breach Notification (conditional)
  if (dataBreachProcess) {
    sections.push({
      title: '9. Incident Management & Data Breach Protocol',
      content: `
        <p>In the event of a personal data breach impacting your information, we have established an incident response protocol under <strong>Section 8(6) of the Digital Personal Data Protection Act, 2023</strong> and the <strong>CERT-In Cyber Security Directions (2022)</strong>.</p>
        <p>We shall promptly notify the <strong>Data Protection Board of India</strong>, the <strong>Indian Computer Emergency Response Team (CERT-In)</strong> within mandatory reporting windows, and inform affected Data Principals with remediation guidelines without undue delay.</p>`,
    });
  }

  // 10. Third-Party Sharing (conditional)
  if (sharesData) {
    const thirdPartyNames = thirdParties.map((p) => escapeHtml(thirdPartyLabels[p] || p)).join(', ');
    sections.push({
      title: '10. Data Sharing and Third-Party Processors',
      content: `
        <p>We do not sell, rent, or trade your personal data to third parties. We may disclose your data to authorized Data Processors under strict contractual terms requiring equivalent data protection standards.</p>
        <p>Authorized service categories include:${thirdPartyNames ? ` <strong>${thirdPartyNames}</strong>.` : ''}</p>
        <ul>
          <li>Cloud hosting, server infrastructure, and database maintenance;</li>
          ${collectsPayment ? '<li>Authorized payment gateways and financial settlement intermediaries;</li>' : ''}
          <li>Statutory authorities, law enforcement agencies, or legal mandates when required under Indian law.</li>
        </ul>`,
    });
  }

  // 11. Cookies (conditional)
  if (usesCookies) {
    const cookieList = cookieTypes.map((c) => `<li>${escapeHtml(cookieTypeLabels[c] || c)}</li>`).join('\n      ');
    sections.push({
      title: '11. Cookies & Tracking Technologies',
      content: `
        <p>Our Website uses cookies and local storage tokens to ensure secure session control, maintain platform state, and evaluate usage metrics.</p>
        ${cookieTypes.length > 0 ? `<p><strong>Categories utilized:</strong></p><ul>${cookieList}</ul>` : ''}
        <p>You can manage cookie settings directly within your web browser preferences. Disabling essential session cookies may impair portal functionality.</p>`,
    });
  }

  // 12. Data Principal Rights (DPDP Act 2023)
  sections.push({
    title: '12. Rights of the Data Principal (DPDP Act, 2023)',
    content: `
      <p>Under the <strong>Digital Personal Data Protection Act, 2023</strong>, Indian citizens ("Data Principals") hold the following statutory rights:</p>
      <ul>
        <li><strong>Right to Summary & Access:</strong> Obtain a summary of personal data being processed and the processing activities undertaken.</li>
        <li><strong>Right to Correction & Erasure:</strong> Request the correction, completion, updating, or deletion of personal data no longer needed for its specified purpose.</li>
        <li><strong>Right to Grievance Redressal:</strong> Access readily available grievance redressal mechanisms regarding any act or omission by us.</li>
        <li><strong>Right to Nominate:</strong> Nominate any individual to exercise your data rights in the event of death or incapacity.</li>
        <li><strong>Right to Withdraw Consent:</strong> Withdraw previously granted consent at any time without affecting past processing legality.</li>
      </ul>
      <p>To exercise any statutory right, please submit a written request to <a href="mailto:${email}">${email}</a>. We shall respond to valid requests within statutory timelines. If you are not satisfied with our response, you may file a complaint with the <strong>Data Protection Board of India</strong>.</p>`,
  });

  // 13. Children's Data (conditional)
  if (childrenUnder13 || childrenUnder18) {
    sections.push({
      title: "13. Children's Data & Parental Consent",
      content: `
        <p>In accordance with <strong>Section 9 of the DPDP Act, 2023</strong>, we do not knowingly process personal data of children (individuals under 18 years of age) without obtaining <strong>verifiable consent from a parent or lawful guardian</strong>.</p>
        <p>We do not undertake tracking, behavioral monitoring, or targeted advertising directed at children. If you believe a minor has submitted personal data without guardian consent, contact us immediately at <a href="mailto:${email}">${email}</a> for deletion.</p>`,
    });
  }

  // 14. International Transfers (conditional)
  if (targetAudience.toLowerCase().trim() !== 'india') {
    sections.push({
      title: '14. Cross-Border Data Transfers',
      content: `
      <p>Under <strong>Section 16 of the Digital Personal Data Protection Act, 2023</strong>, personal data may generally be transferred outside India for processing, except to countries or territories specifically restricted by the Central Government through official notification. We do not transfer personal data to any jurisdiction so restricted by the Government of India.</p>`,
    });
  }

  // 15. Significant Data Fiduciary (conditional)
  if (isDataFiduciary) {
    sections.push({
      title: '15. Significant Data Fiduciary Obligations',
      content: `
        <p>Where designated as a <strong>Significant Data Fiduciary</strong> under Section 10 of the DPDP Act, 2023, we maintain heightened governance, including appointing an India-resident Data Protection Officer (DPO), conducting periodic Data Protection Impact Assessments (DPIA), and executing independent security audits.</p>`,
    });
  }

  // 16. Industry-Specific Compliance (conditional)
  if (industry !== 'general') {
    let industryContent = `<p>As an entity operating within the <strong>${escapeHtml(industry)}</strong> sector, ${businessName} complies with applicable sector-specific regulatory guidelines issued by governing Indian bodies.</p>`;
    if (industry === 'fintech') {
      industryContent = `
        <p><strong>Fintech Regulatory Compliance:</strong></p>
        <ul>
          <li><strong>RBI Data Localization Directive:</strong> Payment and transaction system data of Indian users is stored exclusively on servers situated within India.</li>
          <li><strong>NPCI & UPI Framework:</strong> Payment initiation and tokenization adhere strictly to NPCI cybersecurity mandates.</li>
        </ul>`;
    } else if (industry === 'healthtech') {
      industryContent = `
        <p><strong>Healthtech Data Safeguards:</strong> Medical, prescription, and health records are processed as sensitive data under strict confidentiality controls adhering to the Clinical Establishments Act and digital health data frameworks.</p>`;
    } else if (industry === 'edtech') {
      industryContent = `
        <p><strong>Edtech Privacy Safeguards:</strong> Educational records and student interaction data are stored securely with strict verifiable parental consent mechanisms for minors.</p>`;
    }
    sections.push({
      title: '16. Sector-Specific Regulatory Compliance',
      content: industryContent,
    });
  }

  // 17. Grievance Redressal Officer (IT Rules 2021 Mandate)
  sections.push({
    title: '17. Grievance Redressal Officer',
    content: `
      <p>In accordance with the <strong>Digital Personal Data Protection Act, 2023</strong>, and where applicable, <strong>Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, we have appointed a Grievance Officer to address user concerns:</p>
      <p>
        <strong>Grievance Officer:</strong> ${grievanceOfficerName}<br>
        <strong>Email:</strong> <a href="mailto:${grievanceOfficerEmail}">${grievanceOfficerEmail}</a><br>
        ${grievanceOfficerPhone ? `<strong>Phone:</strong> ${grievanceOfficerPhone}<br>` : ''}
        ${address ? `<strong>Address:</strong> ${address}<br>` : ''}
      </p>
      <p><strong>Timeline:</strong> We shall acknowledge any statutory grievance or complaint within <strong>24 hours</strong> of receipt and resolve the grievance within <strong>15 days</strong> as mandated under Indian law.</p>`,
  });

  // 18. Contact Us
  sections.push({
    title: '18. Contact & Notice Address',
    content: `
      <p>For general inquiries or privacy clarifications regarding this policy, please reach out to us at:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Website:</strong> <a href="${websiteUrl}">${websiteUrl}</a><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br>
        ${phone ? `<strong>Phone:</strong> ${phone}<br>` : ''}
        ${address ? `<strong>Address:</strong> ${address}` : ''}
      </p>`,
  });

  // ─── 6. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 7. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Privacy Policy',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This Privacy Policy governs the collection, processing, and protection of personal data by <strong>${businessName}</strong> in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000 of India.</p>`,
  });

  // ─── 8. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 9. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meitYLaws = LAW_REGISTRY['MeitY'] || [];

  return {
    html,
    text,
    title: `Privacy Policy - ${businessName}`,
    complianceInfo: {
      laws: meitYLaws.filter(
        (law) =>
          law.name.includes('Information Technology Act') ||
          law.name.includes('Digital Personal Data Protection')
      ),
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'IN',
    },
  };
}