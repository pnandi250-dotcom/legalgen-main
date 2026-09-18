// src/lib/legalgen/cancellation-policy.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateCancellationPolicy(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const phone = escapeHtml((data.phone as string) || '');
  const address = escapeHtml((data.address as string) || '');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // Specific Cancellation Variables
  const noticePeriod = escapeHtml((data.noticePeriod as string) || '24 hours');
  const cancellationWindow = escapeHtml((data.cancellationWindow as string) || '24 hours');

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  const sellsPhysicalGoods = !!data.sellsProducts;
  const sellsDigitalGoods = !!data.digitalProducts;
  const sellsServices = !!data.sellsServices;
  const hasBookingSystem = !!data.hasBookingSystem;
  const hasSubscriptions = !!data.hasSubscriptions;

  // ─── 3. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction & Statutory Mandate
  sections.push({
    title: '1. Introduction & Cancellation Rights',
    content: `
      <p>This Cancellation Policy ("Policy") outlines the terms, conditions, and procedures for cancelling orders, subscriptions, services, or bookings made with <strong>${businessName}</strong> ("we," "us," or "our").</p>
      <p>This document is published in accordance with the provisions of the <strong>Consumer Protection Act, 2019</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, which mandate transparency regarding cancellation processes for digital and physical transactions.</p>
      <p>We understand that circumstances may change. This Policy ensures you have clear information about how and when cancellations can be processed.</p>`,
  });

  // 2. General Cancellation Rights
  sections.push({
    title: '2. General Cancellation Rights',
    content: `
      <p>You may request a cancellation of your order, subscription, service, or booking subject to the following conditions:</p>
      <ul>
        <li><strong>Cancellation Window:</strong> Cancellation requests must be initiated within <strong>${cancellationWindow}</strong> of placing the order/booking, or before the service/shipping is initiated, whichever is earlier.</li>
        <li><strong>Notice Period for Subscriptions:</strong> For recurring subscriptions, you must notify us at least <strong>${noticePeriod}</strong> before your next billing cycle to avoid being charged for the subsequent period.</li>
        <li><strong>Written Request Required:</strong> All cancellations must be requested in writing via email to ensure proper documentation and timely processing.</li>
      </ul>
      <p>To initiate a cancellation, please contact our support team at <a href="mailto:${email}">${email}</a> with your order reference number, booking ID, or subscription details.</p>`,
  });

  // 3. Physical Goods Cancellation (conditional)
  if (sellsPhysicalGoods) {
    sections.push({
      title: '3. Cancellation for Physical Goods',
      content: `
        <p>If you have ordered physical products from us, the following cancellation terms apply:</p>
        <ul>
          <li><strong>Before Dispatch:</strong> Orders that have not yet been dispatched or handed over to our logistics partners may be cancelled in full. We will initiate the refund process within 1-3 business days of approval.</li>
          <li><strong>After Dispatch:</strong> Once an order has been shipped, it cannot be cancelled through this Policy. In such cases, our standard Return & Refund Policy will apply upon delivery.</li>
          <li><strong>Custom/Personalized Items:</strong> Orders for custom-made, personalized, or made-to-order products cannot be cancelled once production has commenced, as these items are manufactured specifically for you.</li>
        </ul>
        <p>Please refer to our Shipping & Delivery Policy for information on how to identify whether your order has been dispatched.</p>`,
    });
  }

  // 4. Digital Goods Cancellation (conditional)
  if (sellsDigitalGoods) {
    sections.push({
      title: '4. Cancellation for Digital Products & SaaS',
      content: `
        <p>Digital products and software licenses have specific cancellation considerations due to their instantaneous nature:</p>
        <ul>
          <li><strong>Instant Access:</strong> Once a digital product (e-book, software license, download link, or access credentials) has been provisioned or accessed, the sale is considered final and is not eligible for cancellation unless the product is critically defective and inaccessible.</li>
          <li><strong>Subscription Services:</strong> Subscriptions to digital platforms or SaaS products may be cancelled at any time. Upon cancellation, you will retain access until the end of your current billing period, after which access will be terminated.</li>
          <li><strong>No Partial Refunds:</strong> We do not provide prorated refunds or partial cancellations for subscription periods already begun, except where required by law or in cases of verified service unavailability.</li>
        </ul>`,
    });
  }

  // 5. Services Cancellation (conditional)
  if (sellsServices) {
    sections.push({
      title: '5. Cancellation for Services',
      content: `
        <p>If you have engaged our professional or consulting services, the following terms apply:</p>
        <ul>
          <li><strong>Before Commencement:</strong> Services that have not yet commenced may be cancelled with a written notice. Any advance payment made will be refunded within 5-7 business days, minus any non-refundable deposit specified in your service agreement.</li>
          <li><strong>Post-Commencement:</strong> For milestone-based or ongoing services, cancellations after work has begun may be subject to pro-rata deductions for work completed up to the date of cancellation, as per the applicable Service Level Agreement (SLA).</li>
          <li><strong>Service Deficiencies:</strong> If there is a documented failure on our part to deliver the promised service as per agreed standards, you may be eligible for a full or partial refund upon review.</li>
        </ul>`,
    });
  }

  // 6. Booking System Cancellation (conditional)
  if (hasBookingSystem) {
    sections.push({
      title: '6. Cancellation for Bookings & Reservations',
      content: `
        <p>For bookings made through our reservation system (appointments, events, accommodations, etc.):</p>
        <ul>
          <li><strong>Cancellation Deadlines:</strong> Each booking type has specific cancellation deadlines, which will be clearly displayed during the booking process and in your confirmation email.</li>
          <li><strong>Late Cancellations:</strong> Cancellations made after the stated deadline may incur a cancellation fee (up to 100% of the booking amount), depending on how close to the scheduled date/time the cancellation is received.</li>
          <li><strong>No-Shows:</strong> Failure to appear for a scheduled booking without prior cancellation will typically result in full charges being applied, and no refund will be provided.</li>
          <li><strong>Force Majeure:</strong> In the event of circumstances beyond reasonable control (natural disasters, pandemics, government restrictions), we will work with you to reschedule or provide credit for future bookings.</li>
        </ul>`,
    });
  }

  // 7. Subscription Cancellation (conditional)
  if (hasSubscriptions) {
    sections.push({
      title: '7. Subscription Cancellation & Auto-Renewal',
      content: `
        <p>If you have subscribed to any of our recurring services:</p>
        <ul>
          <li><strong>Cancellation Process:</strong> You may cancel your subscription at any time from your account settings or by contacting us at <a href="mailto:${email}">${email}</a>. We recommend requesting cancellation at least <strong>${noticePeriod}</strong> before your next billing date.</li>
          <li><strong>Effect of Cancellation:</strong> Upon successful cancellation, auto-renewal will be disabled. You will continue to have access to subscription benefits until the end of the current paid period.</li>
          <li><strong>No Prorated Refunds:</strong> We do not offer partial refunds for unused portions of a subscription period, except as required by applicable law or in cases of verified service deficiency on our part.</li>
          <li><strong>Re-subscription:</strong> If you wish to re-subscribe after cancellation, you may do so at the then-current subscription rates, which may differ from your previous rate.</li>
        </ul>`,
    });
  }

  // 8. Non-Cancellable Items
  sections.push({
    title: '8. Non-Cancellable Orders & Exceptions',
    content: `
      <p>Certain categories of orders and services are explicitly non-cancellable under this Policy:</p>
      <ul>
        ${sellsPhysicalGoods ? '<li>Custom-made, personalized, made-to-order, or perishable goods once production or preparation has commenced.</li>' : ''}
        ${sellsDigitalGoods ? '<li>Digital content that has already been downloaded, accessed, or where license keys have been revealed.</li>' : ''}
        ${sellsServices ? '<li>Services that have been fully delivered, completed, or substantially performed.</li>' : ''}
        <li>Items purchased during clearance sales, flash sales, or marked as "Final Sale" or "Non-Returnable."</li>
        <li>Gift cards, vouchers, or promotional credits once issued.</li>
        <li>Orders that have already been dispatched and are in transit (please use our Return Policy instead).</li>
      </ul>
      <p>If you are uncertain whether your order qualifies for cancellation, please contact us before placing the order.</p>`,
  });

  // 9. Refund Processing After Cancellation
  sections.push({
    title: '9. Refund Processing Timelines',
    content: `
      <p>Once your cancellation request is approved, refunds (if applicable) will be processed according to the following timelines:</p>
      <ul>
        <li><strong>Approval Timeframe:</strong> We aim to review and approve valid cancellation requests within 1 to 3 business days of receipt.</li>
        <li><strong>Bank/Payment Gateway Crediting:</strong> Once approved, refunds are credited back to your original source of payment within <strong>5 to 7 business days</strong>, subject to your bank's or payment provider's own processing times.</li>
        <li><strong>Store Credit/Wallet Option:</strong> If you opt for store credit or wallet refund instead of a bank refund, the amount will be reflected in your account within 24 to 48 hours.</li>
      </ul>
      <p><em>Anti-Money Laundering (AML) Note: We can only process refunds to the original payment method used during the transaction. Cash refunds are strictly prohibited in compliance with RBI guidelines.</em></p>`,
  });

  // 10. Failed/Dropped Transactions
  sections.push({
    title: '10. Failed or Dropped Transactions',
    content: `
      <p>If a transaction fails or drops but the amount is debited from your bank account or credit card, the payment gateway will automatically initiate an auto-refund. As per <strong>RBI mandates</strong>, auto-refunds for dropped transactions are typically credited back to the customer's account within <strong>T+5 days</strong> (Transaction Date + 5 business days).</p>
      <p>If you do not receive the auto-refund within this stipulated timeframe, please contact your issuing bank with the transaction reference number, or reach out to us at <a href="mailto:${email}">${email}</a> for assistance in tracking the gateway status.</p>`,
  });

  // 11. How to Request Cancellation
  sections.push({
    title: '11. How to Request a Cancellation',
    content: `
      <p>To ensure your cancellation request is processed promptly and accurately, please follow these steps:</p>
      <ol>
        <li>Email us at <a href="mailto:${email}">${email}</a> with the subject line: "Cancellation Request - [Your Order/Booking ID]".</li>
        <li>Include your full name, order/booking reference number, and the reason for cancellation (optional but helpful).</li>
        <li>Specify whether you prefer a refund to the original payment method or store credit (where applicable).</li>
        <li>You will receive an acknowledgment email within <strong>24 hours</strong>, and we aim to resolve your request within <strong>one month</strong> of receipt, as mandated under Indian consumer protection laws.</li>
      </ol>
      ${phone ? `<p>Alternatively, you may call us at <strong>${phone}</strong> during business hours for immediate assistance.</p>` : ''}`,
  });

  // 12. Contact & Grievance Redressal
  sections.push({
    title: '12. Contact Us & Grievance Redressal',
    content: `
      <p>If you have any disputes or grievances regarding a cancellation decision, refund processing, or any aspect of this Policy, please contact our support team:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a><br>
        ${phone ? `<strong>Phone:</strong> ${phone}<br>` : ''}
        ${address ? `<strong>Address:</strong> ${address}` : ''}
      </p>
      <p>In accordance with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, we will acknowledge your grievance within <strong>48 hours</strong> and aim to resolve it within <strong>one month</strong> of receipt. If you are not satisfied with our resolution, you may escalate the matter to the appropriate Consumer Forum or Commission.</p>`,
  });

  // ─── 4. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 5. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Cancellation Policy',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This policy outlines the statutory rights and operational procedures for cancelling orders, subscriptions, services, and bookings with <strong>${businessName}</strong>.</p>`,
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
    title: `Cancellation Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'IN',
    },
  };
}