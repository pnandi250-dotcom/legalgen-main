// src/lib/legalgen/dmca-policy.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateDmcaPolicy(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');
  const address = escapeHtml((data.address as string) || '');
  const governingState = escapeHtml((data.governingState as string) || 'Delhi');

  // ─── 2. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction & Safe Harbor
  sections.push({
    title: '1. Introduction and Intermediary Status',
    content: `
      <p><strong>${businessName}</strong> ("we," "us," or "our") respects the intellectual property rights of others and expects its users to do the same.</p>
      <p>As a digital intermediary, we claim safe harbor protections from liability for copyright infringement under <strong>Section 79 of the Information Technology Act, 2000 (India)</strong>, as well as the <strong>Digital Millennium Copyright Act (DMCA)</strong> for our international operations. It is our policy to expeditiously remove or disable access to material that is claimed to be infringing upon receipt of a valid notice.</p>`,
  });

  // 2. Designated Agent
  sections.push({
    title: '2. Designated Copyright Agent / Grievance Officer',
    content: `
      <p>In accordance with the IT Rules 2021 and international copyright standards, we have designated a Copyright Agent / Grievance Officer to receive notifications of claimed infringement.</p>
      <p>All copyright infringement claims must be submitted in writing to our Designated Agent at the following contact points:</p>
      <p>
        <strong>${businessName} Copyright Agent</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br>
        ${address ? `<strong>Address:</strong> ${address}` : ''}
      </p>
      <p><em>Please note that contacting the Designated Agent for any purpose other than reporting copyright/IP infringement (such as general customer support) will delay the processing of your request.</em></p>`,
  });

  // 3. Submitting a Takedown Notice
  sections.push({
    title: '3. Submitting a Takedown Notice',
    content: `
      <p>If you are a copyright owner, or authorized to act on behalf of one, and believe that any content hosted on <a href="${websiteUrl}">${websiteUrl}</a> infringes upon your copyrights, you may submit a formal takedown notice.</p>
      <p>To be legally valid and actionable, your notice <strong>must</strong> include the following information:</p>
      <ol>
        <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf;</li>
        <li>Identification of the copyrighted work claimed to have been infringed (e.g., a link to your original work or a detailed description);</li>
        <li>Identification of the material that is claimed to be infringing, providing <strong>exact URLs</strong> so that we may locate it on our platform;</li>
        <li>Your contact information, including your name, address, telephone number, and email address;</li>
        <li>A statement that you have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law;</li>
        <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
      </ol>
     <p>Upon receipt of a valid notice, we will investigate and, where appropriate, remove or disable access to the infringing material within a reasonable timeframe, generally within 2 to 5 business days. Note that a stricter 36-hour removal timeline applies specifically to content removal directed by a court order or a notification from an appropriate government agency, in accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</p>`,
  });

  // 4. Counter-Notice Procedure
  sections.push({
    title: '4. Submitting a Counter-Notice',
    content: `
      <p>If you believe that your content was removed or disabled by mistake or misidentification, you may send a counter-notice to our Designated Agent.</p>
      <p>Your counter-notice must include:</p>
      <ul>
        <li>Your physical or electronic signature;</li>
        <li>Identification of the material that has been removed and the specific URL at which the material appeared before it was removed;</li>
        <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification;</li>
        <li>Your name, address, telephone number, and email address, along with a statement that you consent to the jurisdiction of the competent courts in ${governingState}, India, and that you will accept service of process from the person who provided the original takedown notification.</li>
      </ul>
      <p>If we receive a valid counter-notice, we may forward it to the original complaining party. If the complaining party does not notify us that they have filed a court order seeking to restrain you from engaging in infringing activity within 10 to 14 business days, we may restore the removed content.</p>`,
  });

  // 5. Repeat Infringer Policy
  sections.push({
    title: '5. Repeat Infringer Policy',
    content: `
      <p>In accordance with applicable law, <strong>${businessName}</strong> maintains a strict "Repeat Infringer" policy. We reserve the right to suspend or permanently terminate the accounts of users who are found to repeatedly infringe the intellectual property rights of others. We may also limit access to the platform for any user who infringes any intellectual property rights, regardless of whether there is any repeat infringement, at our sole discretion.</p>`,
  });

  // 6. False Claims and Liability
  sections.push({
    title: '6. Liability for False Claims',
    content: `
      <p>Please be aware that knowingly submitting a false or materially misleading takedown notice may expose you to civil liability under general principles of Indian law, including claims for malicious falsehood or damages, and for our international users, under Section 512(f) of the U.S. DMCA where applicable.</p>
      <p>If you are unsure whether material on our platform infringes your copyright, we strongly recommend consulting an attorney before filing a notice.</p>`,
  });

  // ─── 3. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 4. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'DMCA & Copyright Policy',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This policy outlines our procedures for reporting and resolving intellectual property infringement claims on <strong>${businessName}</strong>.</p>`,
  });

  // ─── 5. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 6. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    { name: "The Copyright Act, 1957", department: "Law & Justice", url: "https://copyright.gov.in/Documents/CopyrightRules1957.pdf" },
    ...meityLaws.filter(l => l.name.includes('Information Technology Act')) // Covers Section 79 Safe Harbor
  ];

  return {
    html,
    text,
    title: `DMCA & Copyright Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: `India (${governingState})`,
    },
  };
}