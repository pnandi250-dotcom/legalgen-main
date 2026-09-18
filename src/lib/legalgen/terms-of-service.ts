// src/lib/legalgen/terms-of-service.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateTermsOfService(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const phone = escapeHtml((data.phone as string) || '');
  const address = escapeHtml((data.address as string) || '');
  const entityType = escapeHtml((data.entityType as string) || '');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // Specific Legal Variables
  const governingState = escapeHtml((data.governingState as string) || 'Delhi'); // Where the courts/arbitration will be held
  const disputeResolution = escapeHtml((data.disputeResolution as string) || 'arbitration'); // 'arbitration' or 'courts'

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  const hasAccounts = !!data.hasAccounts;
  const sellsProducts = !!data.sellsProducts;
  const userGeneratedContent = !!data.userGeneratedContent; // Can users post reviews, comments, or upload files?
  const hasSubscriptions = !!data.hasSubscriptions;

  // ─── 3. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Acceptance & Applicability
  sections.push({
    title: '1. Acceptance of Terms',
    content: `
      <p>These Terms of Service ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you", "User"), and <strong>${businessName}</strong>${entityType ? ` (${entityType})` : ''} ("we", "us", or "our"), concerning your access to and use of the <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a> website as well as any other media form, channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Platform").</p>
      <p>This document is published in accordance with the provisions of <strong>Rule 3(1) of the Information Technology (Intermediaries Guidelines and Digital Media Ethics Code) Rules, 2021</strong> that require publishing the rules and regulations, privacy policy, and Terms of Service for access or usage of the Platform.</p>
      <p>By accessing the Platform, you agree that you have read, understood, and agreed to be bound by all of these Terms. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE PLATFORM AND YOU MUST DISCONTINUE USE IMMEDIATELY.</p>`,
  });

  // 2. Eligibility
  sections.push({
    title: '2. Eligibility to Use',
    content: `
      <p>Use of the Platform is available only to persons who can form legally binding contracts under the <strong>Indian Contract Act, 1872</strong>. Persons who are "incompetent to contract" within the meaning of the Indian Contract Act, 1872 including minors, un-discharged insolvents, etc., are not eligible to use the Platform.</p>
      <p>If you are a minor (under the age of 18 years), you may use the Platform only under the supervision and prior consent of a parent or legal guardian.</p>`,
  });

  // 3. User Accounts (conditional)
  if (hasAccounts) {
    sections.push({
      title: '3. User Accounts and Security',
      content: `
        <p>To access certain features of the Platform, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
        <p>You are entirely responsible for safeguarding and maintaining the confidentiality of your username and password. We will assume that any person using the Platform with your login credentials either is you or is authorized to act for you. You agree to notify us immediately at <a href="mailto:${email}">${email}</a> of any unauthorized access to or use of your account.</p>
        <p>We reserve the right to suspend or terminate your account at any time, with or without notice, if we suspect any violation of these Terms or any applicable Indian laws.</p>`,
    });
  }

  // 4. E-Commerce & Transactions (conditional)
  if (sellsProducts || hasSubscriptions) {
    sections.push({
      title: '4. E-Commerce, Pricing, and Payments',
      content: `
        <p>In compliance with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, all details regarding products, services, pricing, and availability are provided on the Platform. We reserve the right to change prices and availability without prior notice.</p>
        <ul>
          <li><strong>Payments:</strong> All payments must be made through our authorized third-party payment gateways. You agree to provide current, complete, and accurate purchase and account information for all purchases.</li>
          ${hasSubscriptions ? '<li><strong>Subscriptions:</strong> If you purchase a recurring subscription, you authorize us to charge your payment method on a recurring basis without requiring your prior approval for each recurring charge, until you notify us of your cancellation.</li>' : ''}
          <li><strong>Taxes:</strong> All prices are exclusive of applicable taxes (such as GST) unless explicitly stated otherwise. You are responsible for the payment of any such taxes.</li>
        </ul>
        <p>Please refer to our separate Refund and Cancellation Policy for detailed information on returns and refunds.</p>`,
    });
  }

  // 5. Intermediary Safe Harbour & UGC (conditional - VERY IMPORTANT FOR INDIA)
  if (userGeneratedContent) {
    sections.push({
      title: '5. User-Generated Content & Intermediary Status',
      content: `
        <p>To the extent the Platform allows users to post, upload, transmit, or otherwise make available content ("User Content"), <strong>${businessName}</strong> acts purely as an <strong>"Intermediary"</strong> as defined under Section 2(1)(w) of the Information Technology Act, 2000.</p>
        <p><strong>Section 79 Safe Harbour:</strong> We do not actively monitor, pre-screen, or editorially control User Content. We assume no liability or responsibility for any User Content or any defamation, libel, omissions, falsehoods, obscenity, pornography, or profanity contained therein.</p>
        <p>You represent and warrant that you own or have the necessary licenses, rights, and permissions to publish the User Content. By posting User Content, you grant us a non-exclusive, royalty-free, worldwide license to use, reproduce, modify, and display the content in connection with operating the Platform.</p>`,
    });
  }

  // 6. Prohibited Conduct (IT Rules 2021)
  sections.push({
    title: '6. Prohibited Conduct',
    content: `
      <p>As a condition of your use of the Platform, and in strict adherence to <strong>Rule 3(1)(b) of the IT Rules 2021</strong>, you agree NOT to host, display, upload, modify, publish, transmit, store, update, or share any information that:</p>
      <ul>
        <li>Belongs to another person and to which you do not have any right;</li>
        <li>Is defamatory, obscene, pornographic, pedophilic, invasive of another's privacy, including bodily privacy, insulting or harassing on the basis of gender, libelous, racially or ethnically objectionable, or encouraging money laundering or gambling;</li>
        <li>Is harmful to children;</li>
        <li>Infringes any patent, trademark, copyright, or other proprietary rights;</li>
        <li>Violates any law for the time being in force in India;</li>
        <li>Deceives or misleads the addressee about the origin of the message or knowingly and intentionally communicates any information which is patently false or misleading in nature;</li>
        <li>Impersonates another person;</li>
        <li>Contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer resource;</li>
        <li>Threatens the unity, integrity, defense, security, or sovereignty of India, friendly relations with foreign States, or public order.</li>
      </ul>`,
  });

  // 7. Intellectual Property
  sections.push({
    title: '7. Intellectual Property Rights',
    content: `
      <p>Unless otherwise indicated, the Platform is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Platform (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by the <strong>Copyright Act, 1957</strong> and the <strong>Trade Marks Act, 1999</strong> of India.</p>
      <p>No part of the Platform and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</p>`,
  });

  // 8. Limitation of Liability
  sections.push({
    title: '8. Limitation of Liability',
    content: `
      <p>IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
      <p>To the maximum extent permitted by Indian law, our liability to you for any cause whatsoever and regardless of the form of the action, will at all times be limited to the amount paid, if any, by you to us during the six (6) month period prior to any cause of action arising.</p>`,
  });

  // 9. Governing Law & Dispute Resolution
  let disputeContent = '';
  if (disputeResolution === 'arbitration') {
    disputeContent = `
      <p><strong>Arbitration:</strong> Any dispute, claim, or controversy arising out of or relating to these Terms, including the determination of the scope or applicability of these Terms to arbitrate, shall be determined by arbitration in India, before a sole arbitrator mutually appointed by both parties. If the parties are unable to agree on an arbitrator within thirty (30) days of a dispute arising, the arbitrator shall be appointed in accordance with the <strong>Arbitration and Conciliation Act, 1996</strong> (as amended), including its provisions on arbitrator independence and neutrality under Section 12.</p>
      <p>The seat and venue of the arbitration shall be <strong>${governingState}, India</strong>. The language of the arbitration shall be English. The award of the arbitrator shall be final and binding on the parties.</p>`;
  } else {
    disputeContent = `
      <p><strong>Jurisdiction:</strong> Any dispute, claim, or controversy arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts located in <strong>${governingState}, India</strong>.</p>`;
  }

  sections.push({
    title: '9. Governing Law & Dispute Resolution',
    content: `
      <p>These Terms and your use of the Platform are governed by and construed in accordance with the laws of <strong>India</strong>, without regard to its conflict of law principles.</p>
      ${disputeContent}
      <p>Notwithstanding the above, nothing in this clause shall restrict your right, where applicable, to approach the appropriate Consumer Forum or Commission under the <strong>Consumer Protection Act, 2019</strong>.</p>`,
  });
  // 10. Severability
  sections.push({
    title: '10. Severability',
    content: `
      <p>If any provision or part of a provision of these Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Terms and does not affect the validity and enforceability of any remaining provisions.</p>`,
  });

  // 11. Contact & Grievances
  sections.push({
    title: '11. Contact Information & Grievance Redressal',
    content: `
      <p>In accordance with the Information Technology Act, 2000 and rules made there under, if you have any grievances, complaints, or questions regarding these Terms, please contact us at:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br>
        ${phone ? `<strong>Phone:</strong> ${phone}<br>` : ''}
        ${address ? `<strong>Address:</strong> ${address}` : ''}
      </p>`,
  });

  // ─── 4. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 5. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Terms of Service',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>Please read these terms and conditions carefully before using the services provided by <strong>${businessName}</strong>.</p>`,
  });

  // ─── 6. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 7. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const lawJusticeLaws = LAW_REGISTRY['Law & Justice'] || [];
  const meityLaws = LAW_REGISTRY['MeitY'] || [];
  const consumerLaws = LAW_REGISTRY['Consumer Affairs'] || [];

  // Safely grab the actual LawReference objects from your registry
  const relevantLaws = [
    ...lawJusticeLaws.filter(l => l.name.includes('Contract') || l.name.includes('Arbitration')),
    ...meityLaws.filter(l => l.name.includes('Information Technology')),
    ...consumerLaws.filter(l => l.name.includes('Consumer Protection'))
  ];

  return {
    html,
    text,
    title: `Terms of Service - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'IN',
    },
  };
}