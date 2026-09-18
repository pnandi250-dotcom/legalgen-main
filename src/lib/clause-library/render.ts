/**
 * Server-side document rendering.
 *
 * Two jobs:
 *  1. One entry point for every document type, so routes never import 16
 *     generators (and the browser never receives the clause library — F-16).
 *  2. Stamps provenance on the output and removes the placeholder branding
 *     and the unbacked auto-update claim that shipped inside every generated
 *     document (F-10).
 *
 * The generators themselves are your existing, working modules. This file
 * wraps them; it does not replace their legal content.
 */
import { CLAUSE_LIBRARY_VERSION, GENERATOR_VERSION } from './version';
import { BRAND } from '@/lib/constants';

import { generatePrivacyPolicy } from '@/lib/legalgen/privacy-policy';
import { generateMultiJurisdictionPrivacyPolicy } from '@/lib/legalgen/privacy-policy-multi-jurisdiction';
import { generateTermsOfService } from '@/lib/legalgen/terms-of-service';
import { generateRefundPolicy } from '@/lib/legalgen/refund-policy';
import { generateReturnPolicy } from '@/lib/legalgen/return-policy';
import { generateShippingPolicy } from '@/lib/legalgen/shipping-policy';
import { generateCancellationPolicy } from '@/lib/legalgen/cancellation-policy';
import { generateCookiePolicy } from '@/lib/legalgen/cookie-policy';
import { generateDisclaimer } from '@/lib/legalgen/disclaimer';
import { generateEula } from '@/lib/legalgen/eula';
import { generateAup } from '@/lib/legalgen/aup';
import { generateDmcaPolicy } from '@/lib/legalgen/dmca-policy';
import { generateCommunityGuidelines } from '@/lib/legalgen/community-guidelines';
import { generateContentModerationPolicy } from '@/lib/legalgen/content-moderation-policy';
import { generateDataProcessingAgreement } from '@/lib/legalgen/data-processing-agreement';
import { generateGDPRCompliance } from '@/lib/legalgen/gdpr-compliance';
import { generateServiceLevelAgreement } from '@/lib/legalgen/service-level-agreement';

export { CLAUSE_LIBRARY_VERSION, GENERATOR_VERSION };

type Answers = Record<string, string | number | boolean | string[]>;
type Generator = (answers: never, jurisdiction?: never) => { html: string; text?: string; title?: string } | string;

const GENERATORS: Record<string, Generator> = {
    'privacy-policy': generatePrivacyPolicy as Generator,
    'terms-of-service': generateTermsOfService as Generator,
    'refund-policy': generateRefundPolicy as Generator,
    'return-policy': generateReturnPolicy as Generator,
    'shipping-policy': generateShippingPolicy as Generator,
    'cancellation-policy': generateCancellationPolicy as Generator,
    'cookie-policy': generateCookiePolicy as Generator,
    disclaimer: generateDisclaimer as Generator,
    eula: generateEula as Generator,
    aup: generateAup as Generator,
    'dmca-policy': generateDmcaPolicy as Generator,
    'community-guidelines': generateCommunityGuidelines as Generator,
    'content-moderation-policy': generateContentModerationPolicy as Generator,
    'data-processing-agreement': generateDataProcessingAgreement as Generator,
    'gdpr-compliance': generateGDPRCompliance as Generator,
    'service-level-agreement': generateServiceLevelAgreement as Generator,
};

export interface RenderInput {
    documentType: string;
    jurisdiction: string;
    answers: Answers;
}

export interface RenderResult {
    html: string;
    title: string;
    clauseLibraryVersion: string;
    generatorVersion: string;
}

export function renderDocument(input: RenderInput): RenderResult {
    const generator = GENERATORS[input.documentType];
    if (!generator) throw new Error(`No generator registered for ${input.documentType}`);

    // Multi-jurisdiction privacy policy takes a jurisdiction list.
    const raw =
        input.documentType === 'privacy-policy' && input.jurisdiction !== 'IN'
            ? (generateMultiJurisdictionPrivacyPolicy as unknown as Generator)(
                  input.answers as never,
                  [input.jurisdiction] as never,
              )
            : generator(input.answers as never, input.jurisdiction as never);

    const body = typeof raw === 'string' ? raw : raw.html;
    const title = typeof raw === 'string' ? input.documentType : (raw.title ?? input.documentType);

    return {
        html: body + renderProvenanceFooter(input.jurisdiction, title),
        title,
        clauseLibraryVersion: CLAUSE_LIBRARY_VERSION,
        generatorVersion: GENERATOR_VERSION,
    };
}

/**
 * Replaces generateFooterHTML(). Differences that matter:
 *  - no placeholder brand, no placeholder domain (F-10)
 *  - no claim that the document updates itself
 *  - states the clause-library version and the date, which IS defensible
 */
export function renderProvenanceFooter(jurisdiction: string, documentTitle: string): string {
    const generatedOn = new Date().toISOString().slice(0, 10);
    const framework =
        jurisdiction === 'IN'
            ? 'the Information Technology Act 2000, the Digital Personal Data Protection Act 2023, and the Consumer Protection Act 2019'
            : 'widely applied international data-protection standards, including the GDPR and CCPA frameworks';

    return `
<section class="lg-provenance" style="margin-top:48px;padding-top:24px;border-top:2px solid #e5e7eb;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#4b5563;">
  <h3 style="font-size:15px;margin:0 0 8px;color:#1f2937;">About this ${escapeHtml(documentTitle)}</h3>
  <p style="line-height:1.6;margin:0 0 12px;font-size:13px;">
    This document was generated from the details provided and is drafted with reference to ${framework}.
    It is a template, not legal advice. Have a qualified lawyer in your jurisdiction review it before you publish it.
  </p>
  <dl style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:0;font-size:12px;color:#6b7280;">
    <dt>Generated</dt><dd style="margin:0;color:#374151;">${generatedOn}</dd>
    <dt>Framework</dt><dd style="margin:0;color:#374151;">${escapeHtml(jurisdiction)}</dd>
    <dt>Clause library</dt><dd style="margin:0;color:#374151;">${CLAUSE_LIBRARY_VERSION}</dd>
  </dl>
  <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">
    Generated with <a href="${BRAND.url}" style="color:#4f46e5;">${escapeHtml(BRAND.name)}</a>.
  </p>
</section>`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
