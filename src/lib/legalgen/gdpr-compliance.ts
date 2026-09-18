// src/lib/legalgen/gdpr-compliance.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateGDPRCompliance(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // ─── 2. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction & Extraterritorial Scope
  sections.push({
    title: '1. Introduction and Commitment to GDPR',
    content: `
      <p><strong>${businessName}</strong> ("we," "us," or "our") operates globally from our headquarters in India. We are fully committed to complying with the <strong>General Data Protection Regulation (GDPR) (EU) 2016/679</strong> for our users residing in the European Economic Area (EEA) and the United Kingdom.</p>
      <p>This GDPR Compliance Statement acts as a supplement to our primary Privacy Policy and outlines the specific rights, legal bases, and data protection mechanisms applied to our EU/UK users.</p>
      <p><strong>EU/UK Representative:</strong> Where required under Article 27 of the GDPR, we designate a representative within the European Union and/or United Kingdom to act as our point of contact for supervisory authorities and data subjects. Details of our appointed representative, where applicable, are available on request at <a href="mailto:${email}">${email}</a>.</p>`,
  });

  // 2. Legal Basis for Processing
  sections.push({
    title: '2. Legal Basis for Processing (Article 6)',
    content: `
      <p>Under the GDPR, we only process your personal data when we have a valid legal basis to do so. Our primary legal bases include:</p>
      <ul>
        <li><strong>Consent:</strong> Where you have given explicit consent for us to process your data for a specific purpose (e.g., subscribing to a newsletter).</li>
        <li><strong>Contractual Necessity:</strong> Where processing is necessary for the performance of a contract to which you are a party (e.g., providing our core SaaS services).</li>
        <li><strong>Legal Obligation:</strong> Where processing is necessary for compliance with a legal obligation to which we are subject (e.g., financial and tax reporting).</li>
        <li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate business interests, provided those interests are not overridden by your fundamental rights and freedoms (e.g., improving our software, preventing fraud).</li>
      </ul>`,
  });

  // 3. Data Subject Rights
  sections.push({
    title: '3. Your Rights as a Data Subject (Articles 15-21)',
    content: `
      <p>If you are a resident of the EEA or the UK, you possess specific rights regarding your personal data under the GDPR:</p>
      <ul>
        <li><strong>Right of Access:</strong> You have the right to request a copy of the personal data we hold about you.</li>
        <li><strong>Right to Rectification:</strong> You have the right to request that we correct any inaccurate or incomplete personal data.</li>
        <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You have the right to request the deletion of your personal data under certain conditions.</li>
        <li><strong>Right to Restrict Processing:</strong> You have the right to request that we limit the processing of your personal data.</li>
        <li><strong>Right to Data Portability:</strong> You have the right to receive your data in a structured, commonly used, and machine-readable format.</li>
        <li><strong>Right to Object:</strong> You have the right to object to our processing of your personal data, particularly for direct marketing purposes.</li>
      </ul>
      <p>To exercise any of these rights, please contact our Data Protection Officer (DPO) at <a href="mailto:${email}">${email}</a>. We will respond to your request within 30 days.</p>`,
  });

  // 4. International Data Transfers (Important for Indian companies)
  sections.push({
    title: '4. International Data Transfers (Chapter V)',
    content: `
      <p>Because <strong>${businessName}</strong> is headquartered in India, personal data collected from EU/UK users will be transferred to and processed in India.</p>
<p>As India does not currently benefit from a European Commission adequacy decision, we implement appropriate safeguards for these international transfers as required under Chapter V of the GDPR. These safeguards primarily include the use of <strong>Standard Contractual Clauses (SCCs)</strong> approved by the European Commission, alongside rigorous technical and organizational security measures.</p>`,
  });

  // 5. Data Processing Agreement (DPA) reference
  sections.push({
    title: '5. B2B Customers and Data Processing Agreements',
    content: `
      <p>If you are a business utilizing our platform to process the personal data of your own EU/UK customers, <strong>${businessName}</strong> acts as a "Data Processor" under the GDPR. We offer a robust Data Processing Agreement (DPA) incorporating standard contractual clauses to govern this relationship.</p>
      <p>Please contact us to execute a DPA tailored to your organizational needs.</p>`,
  });

  // 6. Contact and Supervisory Authority
  sections.push({
    title: '6. Contact and Complaints',
    content: `
      <p>If you have questions regarding this statement or our privacy practices, please contact our Data Protection Officer at:</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p>If you believe that our processing of your personal data infringes the GDPR, you have the right to lodge a complaint with the supervisory authority of your habitual residence, place of work, or the place of the alleged infringement within the EEA or UK.</p>`,
  });

  // ─── 3. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 4. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'GDPR Compliance Statement',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This statement details how <strong>${businessName}</strong> complies with the General Data Protection Regulation (GDPR) for our users in the European Economic Area (EEA) and the United Kingdom.</p>`,
  });

  // ─── 5. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 6. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    { name: "General Data Protection Regulation (GDPR)", department: "International", url: "https://gdpr-info.eu/" },
    ...meityLaws.filter(l => l.name.includes('Data Protection Act')) // Link back to Indian DPDP Act
  ];

  return {
    html,
    text,
    title: `GDPR Compliance - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
            jurisdiction: 'GLOBAL',
    },
  };
}