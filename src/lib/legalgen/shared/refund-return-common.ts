// src/lib/legalgen/shared/refund-return-common.ts
// 
// Shared logic for Return Policy and Refund Policy generators.
// These two documents share ~90% of their structure — this module
// eliminates duplication drift and ensures consistent legal language.
//
// Usage:
//   import { generateEligibilitySection, generateRefundTimeline, ... } from './shared/refund-return-common';

import type { RenderSection } from './render';
import { escapeHtml, safeEmail } from './security';

export interface RefundReturnConfig {
    businessName: string;
    email: string;
    phone: string;
    address: string;
    // Time periods
    periodLabel: string;       // e.g., "7 days" or "returnPeriod"
    cancellationWindow: string; // e.g., "24 hours"
    // Feature flags
    sellsPhysicalGoods: boolean;
    sellsDigitalGoods: boolean;
    sellsServices: boolean;
    offersStoreCredit: boolean;
}

/**
 * Generates the eligibility section for returns/refunds based on product types.
 * Used by both return-policy.ts and refund-policy.ts
 */
export function generateEligibilitySection(config: RefundReturnConfig): RenderSection {
    let content = `<p>We strive to ensure your complete satisfaction. Returns and refunds are processed under the following circumstances:</p><ul>`;

    if (config.sellsPhysicalGoods) {
        content += `
      <li>The product delivered is damaged, defective, or significantly different from its description on our website.</li>
      <li>The product is returned in its original, unused condition with all tags, packaging, and seals intact within <strong>${config.periodLabel}</strong> of delivery.</li>`;
        // Return-policy specific: unboxing video recommendation
        if (config.periodLabel.includes('return') || config.periodLabel === '7 days') {
            content += `<li><strong>Unboxing Video:</strong> We highly recommend recording an unboxing video to expedite damage or missing item claims.</li>`;
        }
    }

    if (config.sellsDigitalGoods) {
        content += `
      <li><strong>Digital Products/SaaS:</strong> Due to the instantaneous nature of digital goods and software, all sales are considered final once the license key, download link, or access has been provisioned, unless the digital product is proven to be critically defective and inaccessible.</li>`;
    }

    if (config.sellsServices) {
        content += `
      <li><strong>Service Deficiencies:</strong> If there is a documented failure on our part to deliver the promised service as per the agreed Service Level Agreement (SLA).</li>`;
    }

    content += `</ul>`;

    return {
        title: '3. Return & Exchange Eligibility',
        content,
    };
}

/**
 * Generates the non-returnable/non-refundable items section.
 */
export function generateNonEligibleSection(config: RefundReturnConfig): RenderSection {
    const title = '4. Non-Returnable Items';
    const noun = 'Returns'; // Use "Refunds" for refund-policy

    let content = `<p>Under the Consumer Protection Rules, certain categories of transactions are exempt from mandatory ${noun.toLowerCase()}. ${noun} will <strong>not</strong> be accepted for:</p><ul>`;

    if (config.sellsPhysicalGoods) {
        content += `
      <li>Custom-made, personalized, perishable, or intimate/hygiene goods.</li>
      <li>Products that have been used, altered, washed, or damaged by the consumer.</li>`;
    }

    if (config.sellsDigitalGoods) {
        content += `
      <li>Downloaded digital content, software licenses, or customized digital assets where access has already been granted.</li>`;
    }

    content += `
    <li>Services that have been fully consumed or utilized.</li>
    <li>Items purchased during clearance sales or marked as "Final Sale".</li>
    <li>Force Majeure events or delays caused by third-party logistics/internet service providers beyond our reasonable control.
  </ul>`;

    return { title, content };
}

/**
 * Generates the RBI-compliant refund processing timeline section.
 * This is identical for both policies — single source of truth for TAT updates.
 */
export function generateRefundTimelineSection(config: RefundReturnConfig): RenderSection {
    const storeCreditHtml = config.offersStoreCredit
        ? `<li><strong>Store Credit:</strong> If you opt for store credit or wallet refunds, the amount will be reflected in your account within 24${config.periodLabel.includes('hour') ? '' : ' to 48'} hours.</li>`
        : '';

    return {
        title: '5. Refund Processing Timelines',
        content: `
      <p>Once your return is received and inspected (or your cancellation request is approved), we will notify you of the approval or rejection of your refund.</p>
      <p><strong>Processing Timelines:</strong></p>
      <ul>
        <li><strong>Quality Check:</strong> 1 to 3 business days after receiving the returned item.</li>
        <li><strong>Bank/Payment Gateway Crediting:</strong> Once approved, refunds are credited back to your original source of payment within <strong>5 to 7 business days</strong>, subject to your bank's or payment provider's own processing times.</li>
        ${storeCreditHtml}
      </ul>
      <p><em>Anti-Money Laundering (AML) Note: We can only process refunds to the original payment method used during the transaction. Cash refunds are strictly prohibited.</em></p>`,
    };
}

/**
 * Generates the failed/dropped transactions section (RBI T+5 mandate).
 */
export function generateFailedTransactionSection(config: RefundReturnConfig): RenderSection {
    return {
        title: '6. Failed or Dropped Transactions',
        content: `
      <p>If a transaction fails or drops but the amount is debited from your bank account or credit card, the payment gateway will automatically initiate an auto-refund. As per RBI mandates, auto-refunds for dropped transactions are typically credited back to the customer's account within <strong>T+5 days</strong> (Transaction Date + 5 business days).</p>
      <p>If you do not receive the auto-refund within this stipulated timeframe, please contact your issuing bank with the transaction reference number, or reach out to us at <a href="mailto:${config.email}">${config.email}</a>.</p>`,
    };
}

/**
 * Generates the contact & grievance redressal section with IT Rules 2021 compliance.
 */
export function generateContactGrievanceSection(config: RefundReturnConfig): RenderSection {
    const phoneHtml = config.phone ? `<strong>Phone:</strong> ${config.phone}<br>` : '';
    const addressHtml = config.address ? `<strong>Address:</strong> ${config.address}` : '';

    return {
        title: '7. Contact & Grievance Redressal',
        content: `
      <p>If you have any disputes or grievances regarding a return, refund, or cancellation, please contact our support team:</p>
      <p>
        <strong>${config.businessName}</strong><br>
        <strong>Email:</strong> <a href="mailto:${config.email}">${config.email}</a><br>
        ${phoneHtml}
        ${addressHtml}
      </p>
      <p>In accordance with the Consumer Protection (E-Commerce) Rules, 2020, we will acknowledge your grievance within <strong>48 hours</strong> and aim to resolve it within <strong>one month</strong> of receipt.</p>`,
    };
}

/**
 * Returns the relevant law references for refund/return documents.
 * Centralized so updates only need to happen here.
 */
export function getRefundReturnLaws(lawRegistry: Record<string, any[]>): any[] {
    const consumerLaws = lawRegistry['Consumer Affairs'] || [];
    const rbiLaws = lawRegistry['RBI'] || [];

    return [
        ...consumerLaws.filter((l: any) => l.name.includes('Consumer Protection')),
        ...rbiLaws.filter((l: any) =>
            l.name.includes('Turn Around Time') || l.name.includes('Payment and Settlement')
        ),
    ];
}