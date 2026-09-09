// src/lib/legalgen/content-moderation-policy.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateContentModerationPolicy(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  const usesAutomatedModeration = !!data.usesAutomatedModeration;
  const hasAppealsProcess = !!data.hasAppealsProcess;

  // ─── 3. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction & Statutory Mandate
  sections.push({
    title: '1. Introduction and Statutory Mandate',
    content: `
      <p>This Content Moderation Policy details the frameworks, technologies, and procedures utilized by <strong>${businessName}</strong> ("we," "us," or "our") to monitor, review, and act upon User-Generated Content (UGC) across our platform.</p>
      <p>This policy is published in strict compliance with our obligations as a digital intermediary under the <strong>Information Technology Act, 2000</strong> and the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, ensuring a safe, transparent, and legally compliant environment for all users.</p>`,
  });

  // 2. Core Moderation Principles
  sections.push({
    title: '2. Core Principles of Moderation',
    content: `
      <p>Our content moderation strategy is guided by the following core principles:</p>
      <ul>
        <li><strong>Legality:</strong> Rapid removal of content that violates Indian law, including the Bharatiya Nyaya Sanhita (BNS), 2023.</li>
        <li><strong>Proportionality:</strong> Enforcement actions are scaled appropriately to the severity and frequency of the violation.</li>
        <li><strong>Transparency:</strong> Providing clear guidelines (via our Community Guidelines) and transparent notices when content is removed or restricted.</li>
        <li><strong>Fairness:</strong> Maintaining an equitable appeals process to rectify algorithmic or human moderation errors.</li>
      </ul>`,
  });

  // 3. Moderation Mechanisms (AI vs Human)
  let moderationContent = `<p>Due to the volume of content generated on our platform, we employ a hybrid moderation approach:</p><ul>`;

  if (usesAutomatedModeration) {
    moderationContent += `
      <li><strong>Automated Systems (AI Filters):</strong> We utilize automated hashing, keyword filtering, and machine learning models to proactively detect known illegal content (such as CSAM), spam, and severe hate speech before or shortly after it is published.</li>`;
  }

  moderationContent += `
    <li><strong>Human Review:</strong> Content flagged by our automated systems, or reported by our community/law enforcement, is escalated to our trained human moderation team for contextual review. Human moderators make the final determination on nuanced violations.</li>
    <li><strong>Community Reporting:</strong> We empower our users with in-app reporting tools to flag content that they believe violates our Community Guidelines or applicable laws.</li>
  </ul>`;

  sections.push({
    title: '3. Moderation Mechanisms and Detection',
    content: moderationContent,
  });

  // 4. Enforcement Actions
  sections.push({
    title: '4. Enforcement Actions',
    content: `
      <p>When content is found to be in violation of our guidelines or the law, we may take one or more of the following actions without prior notice to the user:</p>
      <ul>
        <li><strong>Content Takedown:</strong> Permanent removal of the violating text, image, video, or link.</li>
        <li><strong>Downranking / Shadowbanning:</strong> Reducing the algorithmic visibility of borderline content.</li>
        <li><strong>Account Strikes / Suspension:</strong> Issuing formal warnings or temporarily suspending the user's ability to post or interact.</li>
        <li><strong>Permanent Ban:</strong> Indefinite termination of the account for severe or repeated violations.</li>
        <li><strong>Law Enforcement Escalation:</strong> Preserving data and reporting the user to the Indian Computer Emergency Response Team (CERT-In) or local authorities if the content poses an imminent threat to life or involves severe cybercrime.</li>
      </ul>`,
  });

  // 5. Appeals and Grievance Redressal
  let appealsContent = `
    <p>In accordance with the IT Rules 2021, we maintain a robust Grievance Redressal Mechanism to handle user complaints regarding content moderation decisions.</p>`;

  if (hasAppealsProcess) {
    appealsContent += `
      <p><strong>Appeals:</strong> If your content was removed or your account was penalized, and you believe this was an error, you may submit an appeal within 30 days of the enforcement action. Our secondary review team will reassess the content contextually.</p>`;
  }

  appealsContent += `
    <p>To file a grievance regarding content on our platform, or to appeal a moderation decision, please contact our Resident Grievance Officer:</p>
    <p>
      <strong>Grievance Officer:</strong> Legal/Trust & Safety Team<br>
      <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
    </p>
    <p>We are legally mandated to acknowledge all grievances within 24 hours and dispose of them within 15 days from the date of receipt.</p>`;

  sections.push({
    title: '5. Appeals and Grievance Redressal',
    content: appealsContent,
  });

  // 6. Government and Law Enforcement Requests
  sections.push({
    title: '6. Government Takedown Orders (Section 69A)',
    content: `
      <p>We strictly comply with lawful orders issued by authorized government agencies or competent courts in India under <strong>Section 69A of the Information Technology Act, 2000</strong>. When legally compelled to block public access to specific content in the interest of national security, sovereignty, or public order, we will execute the takedown within the statutorily mandated 36-hour timeframe.</p>`,
  });

  // ─── 4. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 5. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Content Moderation Policy',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This policy details the operational procedures utilized by <strong>${businessName}</strong> to enforce safety, legality, and platform integrity.</p>`,
  });

  // ─── 6. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 7. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    ...meityLaws.filter(l => l.name.includes('Intermediary Guidelines') || l.name.includes('Information Technology Act')),
    { name: "Bharatiya Nyaya Sanhita (BNS), 2023", department: "Law & Justice", url: "https://www.mha.gov.in/" }
  ];

  return {
    html,
    text,
    title: `Content Moderation Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'India',
    },
  };
}