// src/lib/legalgen/shipping-policy.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateShippingPolicy(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const phone = escapeHtml((data.phone as string) || '');
  const address = escapeHtml((data.address as string) || '');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // Specific Shipping Variables
  const processingTime = escapeHtml((data.processingTime as string) || '1-3 business days');
  const domesticDeliveryTime = escapeHtml((data.domesticDeliveryTime as string) || '3-7 business days');
  const offersInternational = !!data.offersInternationalShipping;
  const internationalDeliveryTime = escapeHtml((data.internationalDeliveryTime as string) || '10-15 business days');

  // ─── 2. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction & Statutory Mandate
  sections.push({
    title: '1. General Shipping Information',
    content: `
      <p>This Shipping and Delivery Policy details the operational procedures, timelines, and costs associated with the delivery of physical goods purchased from <strong>${businessName}</strong> ("we," "us," or "our") via <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a>.</p>
      <p>This document is formulated in compliance with the transparency requirements of the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong> to ensure our customers are fully informed regarding dispatch, transit, and delivery expectations.</p>`,
  });

  // 2. Processing Times
  sections.push({
    title: '2. Order Processing Times',
    content: `
      <p>All orders are subject to a standard processing and fulfillment period before they are dispatched to our logistics partners.</p>
      <ul>
        <li><strong>Standard Processing:</strong> Orders are typically processed and dispatched within <strong>${processingTime}</strong> from the time the order confirmation is generated.</li>
        <li><strong>Operating Hours:</strong> Our fulfillment centers operate Monday through Friday, excluding Indian national and public holidays. Orders placed on weekends or holidays will be processed on the next available business day.</li>
        <li><strong>High Volume Delays:</strong> During festive seasons, promotional sales, or high-volume periods, processing times may be slightly extended. If a significant delay is expected, we will proactively notify you via email or SMS.</li>
      </ul>`,
  });

  // 3. Shipping Rates & Delivery Estimates
  let ratesContent = `
    <p>Shipping charges for your order will be calculated and dynamically displayed at checkout based on the delivery pin code, package weight, and chosen shipping method.</p>
    <p><strong>Estimated Domestic Delivery (India):</strong></p>
    <ul>
      <li>Standard Delivery: <strong>${domesticDeliveryTime}</strong> post-dispatch.</li>
      <li>Deliveries to remote or restricted pin codes (such as North-Eastern states, Jammu & Kashmir, and island territories) may require additional transit time.</li>
    </ul>`;

  if (offersInternational) {
    ratesContent += `
    <p><strong>Estimated International Delivery:</strong></p>
    <ul>
      <li>International Standard: <strong>${internationalDeliveryTime}</strong> post-dispatch.</li>
      <li>Please note that international delivery times are estimates and do not account for potential delays caused by customs clearance procedures in the destination country.</li>
    </ul>`;
  }

  sections.push({
    title: '3. Shipping Rates & Delivery Estimates',
    content: ratesContent,
  });

  // 4. Shipment Confirmation & Tracking
  sections.push({
    title: '4. Shipment Confirmation & Order Tracking',
    content: `
      <p>Once your order has been successfully processed and handed over to our logistics partner, you will receive a Shipment Confirmation email and/or SMS.</p>
      <p>This communication will contain your assigned tracking number(s) and a direct link to track your package in real-time. Tracking information typically becomes active within 24 hours of dispatch.</p>`,
  });

  // 5. Customs, Duties, and Taxes (conditional)
  if (offersInternational) {
    sections.push({
      title: '5. Customs, Duties, and Import Taxes',
      content: `
        <p>For international shipments, <strong>${businessName}</strong> is not responsible for any customs duties, import taxes, or local clearance fees applied to your order by the destination country.</p>
        <p>All fees imposed during or after shipping (including tariffs, taxes, etc.) are the sole responsibility of the customer. Refusal to pay customs duties may result in the package being abandoned or returned. In such cases, standard return and refund policies will apply, minus any return shipping costs incurred by us.</p>`,
    });
  }

  // 6. Damages & Issues
  sections.push({
    title: '6. Damages, Lost Packages, and Delivery Issues',
    content: `
      <p>We partner with highly reputable logistics providers, but unforeseen transit issues can occasionally occur.</p>
      <ul>
        <li><strong>Damaged on Arrival:</strong> If your order arrives damaged, please refuse the delivery if the tampering is obvious. If accepted, please record an unboxing video and contact us within 24-48 hours. Save all packaging materials and damaged goods before filing a claim.</li>
        <li><strong>Lost in Transit:</strong> If your tracking status has not updated for an abnormal period (exceeding 7 business days past the estimated delivery date), please contact us so we can raise an investigation with the courier.</li>
        <li><strong>Incorrect Address:</strong> We are not liable for non-delivery if the shipping address provided at checkout is incorrect or incomplete. Additional shipping charges may apply for re-routing or re-shipping returned packages.</li>
      </ul>`,
  });

  // 7. Contact Information
  sections.push({
    title: '7. Contact Us',
    content: `
      <p>If you have any specific inquiries regarding your shipment, our logistics partners, or this policy, please reach out to our fulfillment team:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br>
        ${phone ? `<strong>Phone:</strong> ${phone}<br>` : ''}
      </p>`,
  });

  // ─── 3. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 4. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Shipping & Delivery Policy',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>Please review our shipping timelines, delivery estimates, and logistics procedures below.</p>`,
  });

  // ─── 5. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 6. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const consumerLaws = LAW_REGISTRY['Consumer Affairs'] || [];

  const relevantLaws = [
    ...consumerLaws.filter(l => l.name.includes('Consumer Protection'))
  ];

  return {
    html,
    text,
    title: `Shipping & Delivery Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'India',
    },
  };
}