// src/lib/legalgen/return-policy.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateReturnPolicy(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const phone = escapeHtml((data.phone as string) || '');
  const address = escapeHtml((data.address as string) || '');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // Specific Return/Refund Variables
  const returnPeriod = escapeHtml((data.refundPeriod as string) || '7 days');
  const cancellationWindow = escapeHtml((data.cancellationWindow as string) || '24 hours');

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  const sellsPhysicalGoods = !!data.sellsProducts;
  const sellsDigitalGoods = !!data.digitalProducts;
  const sellsServices = !!data.sellsServices;
  const offersStoreCredit = !!data.offersStoreCredit;

  // ─── 3. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction & Statutory Mandate
  sections.push({
    title: '1. Introduction & Statutory Mandate',
    content: `
      <p>This Return and Refund Policy ("Policy") outlines the terms and conditions governing returns, exchanges, cancellations, and refunds for transactions made with <strong>${businessName}</strong> ("we," "us," or "our").</p>
      <p>This document is published in accordance with the provisions of the <strong>Consumer Protection Act, 2019</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, which mandate transparency regarding return and refund processes for digital and physical goods.</p>
      <p>By making a purchase on our platform, you signify your understanding and agreement to this Policy.</p>`,
  });

  // 2. Cancellation Policy
  sections.push({
    title: '2. Order Cancellation',
    content: `
      <p>You may request a cancellation of your order subject to the following conditions:</p>
      <ul>
        <li><strong>Cancellation Window:</strong> Cancellation requests must be initiated within <strong>${cancellationWindow}</strong> of placing the order or before the order is dispatched/initiated, whichever is earlier.</li>
        ${sellsPhysicalGoods ? '<li><strong>Physical Goods:</strong> Orders that have already been dispatched or handed over to our logistics partners cannot be cancelled. Standard return procedures will apply upon delivery.</li>' : ''}
        ${sellsServices ? '<li><strong>Services:</strong> Subscriptions or milestone-based services may be cancelled prior to the commencement of the billing cycle. Post-commencement cancellations may be subject to pro-rata deductions.</li>' : ''}
      </ul>
      <p>To initiate a cancellation, contact our support team immediately at <a href="mailto:${email}">${email}</a> with your order reference number.</p>`,
  });

  // 3. Return & Exchange Eligibility
  let eligibilityContent = `<p>We strive to ensure your complete satisfaction. Returns and refunds are processed under the following circumstances:</p><ul>`;

  if (sellsPhysicalGoods) {
    eligibilityContent += `
      <li>The product delivered is damaged, defective, or significantly different from its description on our website.</li>
      <li>The product is returned in its original, unused condition with all tags, packaging, and seals intact within <strong>${returnPeriod}</strong> of delivery.</li>
      <li><strong>Unboxing Video:</strong> We highly recommend recording an unboxing video to expedite damage or missing item claims.</li>`;
  }
  if (sellsDigitalGoods) {
    eligibilityContent += `
      <li><strong>Digital Products/SaaS:</strong> Due to the instantaneous nature of digital goods and software, all sales are considered final once the license key, download link, or access has been provisioned, unless the digital product is proven to be critically defective and inaccessible.</li>`;
  }
  if (sellsServices) {
    eligibilityContent += `
      <li><strong>Service Deficiencies:</strong> If there is a documented failure on our part to deliver the promised service as per the agreed Service Level Agreement (SLA).</li>`;
  }

  eligibilityContent += `</ul>`;

  sections.push({
    title: '3. Return & Exchange Eligibility',
    content: eligibilityContent,
  });

  // 4. Non-Returnable Scenarios
  sections.push({
    title: '4. Non-Returnable Items',
    content: `
      <p>Under the Consumer Protection Rules, certain categories of transactions are exempt from mandatory returns. Returns and refunds will <strong>not</strong> be accepted for:</p>
      <ul>
        ${sellsPhysicalGoods ? '<li>Custom-made, personalized, perishable, or intimate/hygiene goods.</li>' : ''}
        ${sellsPhysicalGoods ? '<li>Products that have been used, altered, washed, or damaged by the consumer.</li>' : ''}
        ${sellsDigitalGoods ? '<li>Downloaded digital content, software licenses, or customized digital assets where access has already been granted.</li>' : ''}
        <li>Services that have been fully consumed or utilized.</li>
        <li>Items purchased during clearance sales or marked as "Final Sale".</li>
      </ul>`,
  });

  // 5. Refund Processing & RBI TAT Guidelines
  sections.push({
    title: '5. Refund Processing Timelines',
    content: `
      <p>Once your return is received and inspected (or your cancellation request is approved), we will notify you of the approval or rejection of your refund.</p>
      <p><strong>Processing Timelines:</strong></p>
      <ul>
        <li><strong>Quality Check:</strong> 1 to 3 business days after receiving the returned item.</li>
        <li><strong>Bank/Payment Gateway Crediting:</strong> Once approved, refunds are credited back to your original source of payment within <strong>5 to 7 business days</strong>, subject to your bank's or payment provider's own processing times.</li>
        ${offersStoreCredit ? `<li><strong>Store Credit:</strong> If you opt for store credit or wallet refunds, the amount will be reflected in your account within 24 to 48 hours.</li>` : ''}
      </ul>
      <p><em>Anti-Money Laundering (AML) Note: We can only process refunds to the original payment method used during the transaction. Cash refunds are strictly prohibited.</em></p>`,
  });

  // 6. Failed Transactions
  sections.push({
    title: '6. Failed or Dropped Transactions',
    content: `
      <p>If a transaction fails or drops but the amount is debited from your bank account or credit card, the payment gateway will automatically initiate an auto-refund. As per RBI mandates, auto-refunds for dropped transactions are typically credited back to the customer's account within <strong>T+5 days</strong> (Transaction Date + 5 business days).</p>
      <p>If you do not receive the auto-refund within this stipulated timeframe, please contact your issuing bank with the transaction reference number, or reach out to us at <a href="mailto:${email}">${email}</a>.</p>`,
  });

  // 7. Contact & Grievance
  sections.push({
    title: '7. Contact & Grievance Redressal',
    content: `
      <p>If you have any disputes or grievances regarding a return, refund, or cancellation, please contact our support team:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br>
        ${phone ? `<strong>Phone:</strong> ${phone}<br>` : ''}
        ${address ? `<strong>Address:</strong> ${address}` : ''}
      </p>
<p>In accordance with the Consumer Protection (E-Commerce) Rules, 2020, we will acknowledge your grievance within <strong>48 hours</strong> and aim to resolve it within <strong>one month</strong> of receipt.</p>`,
  });

  // ─── 4. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 5. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Return & Refund Policy',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This policy outlines the statutory rights and operational procedures for returns, refunds, and cancellations regarding transactions made with <strong>${businessName}</strong>.</p>`,
  });

  // ─── 6. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 7. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const consumerLaws = LAW_REGISTRY['Consumer Affairs'] || [];
  const rbiLaws = LAW_REGISTRY['RBI'] || [];

  const relevantLaws = [
    ...consumerLaws.filter(l => l.name.includes('Consumer Protection')),
    ...rbiLaws.filter(l => l.name.includes('Turn Around Time') || l.name.includes('Payment and Settlement'))
  ];

  return {
    html,
    text,
    title: `Return & Refund Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'IN',
    },
  };
}