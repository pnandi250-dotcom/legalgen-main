// src/lib/legalgen/cookie-policy.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateCookiePolicy(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // ─── 2. ARRAYS & FLAGS ────────────────────────────────────────────────
  const usesCookies = data.usesCookies !== false; // Default to true for this policy
  const cookieTypes = Array.isArray(data.cookieTypes) ? data.cookieTypes : ['essential', 'analytics'];
  const thirdParties = Array.isArray(data.thirdParties) ? data.thirdParties : [];

  // ─── 3. LABEL LOOKUPS ──────────────────────────────────────────────────
  const cookieTypeLabels: Record<string, string> = {
    essential: 'Essential / Strictly Necessary Cookies',
    analytics: 'Analytics / Performance Cookies',
    marketing: 'Marketing / Advertising Cookies',
    functional: 'Functional / Preference Cookies',
  };

  const thirdPartyLabels: Record<string, string> = {
    googleAnalytics: 'Google Analytics',
    googleAds: 'Google Ads',
    facebookPixel: 'Meta (Facebook) Pixel',
    hotjar: 'Hotjar',
    intercom: 'Intercom',
    zendesk: 'Zendesk',
    razorpay: 'Razorpay',
    stripe: 'Stripe',
  };

  // ─── 4. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction
  sections.push({
    title: '1. Introduction & Scope',
    content: `
      <p>This Cookie Policy explains how <strong>${businessName}</strong> ("we", "us", or "our") uses cookies, web beacons, tracking pixels, and similar tracking technologies when you visit our website at <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a>.</p>
      <p>This policy is designed to comply with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong>, ensuring transparency about how your data is collected, stored, and utilized via tracking technologies.</p>
      <p>Please read this policy alongside our Privacy Policy to understand how we protect your personal data.</p>`,
  });

  // 2. What are Cookies?
  sections.push({
    title: '2. What Are Cookies?',
    content: `
      <p>A cookie is a small text file that a website stores on your computer or mobile device when you visit the site. Cookies are widely used to make websites work more efficiently, as well as to provide reporting information and personalized experiences.</p>
      <ul>
        <li><strong>First-party cookies:</strong> Set directly by our website to ensure core functionality.</li>
        <li><strong>Third-party cookies:</strong> Set by authorized third-party domains (such as analytics or advertising partners) to deliver extended services.</li>
        <li><strong>Session cookies:</strong> Temporary cookies that expire when you close your browser.</li>
        <li><strong>Persistent cookies:</strong> Cookies that remain on your device for a set period or until manually deleted.</li>
      </ul>`,
  });

  // 3. Types of Cookies We Use
  let typesContent = `<p>Depending on your usage of our platform, we utilize the following categories of cookies:</p><ul>`;

  if (cookieTypes.includes('essential')) {
    typesContent += `<li><strong>${cookieTypeLabels.essential}:</strong> These cookies are indispensable for the operation of our website. They enable core functions like security, network management, account authentication, and payment processing. Without these, the website cannot function properly, and they are deployed as a necessary part of delivering the services you have requested.</li>`;
  }
  if (cookieTypes.includes('analytics')) {
    typesContent += `<li><strong>${cookieTypeLabels.analytics}:</strong> These cookies allow us to recognize and count the number of visitors and see how visitors move around our website. This helps us improve the way our website works (e.g., ensuring users find what they are looking for easily).</li>`;
  }
  if (cookieTypes.includes('functional')) {
    typesContent += `<li><strong>${cookieTypeLabels.functional}:</strong> These cookies are used to recognize you when you return to our website. They enable us to personalize our content for you, greet you by name, and remember your preferences (e.g., your choice of language or region).</li>`;
  }
  if (cookieTypes.includes('marketing')) {
    typesContent += `<li><strong>${cookieTypeLabels.marketing}:</strong> These cookies record your visit to our website, the pages you have visited, and the links you have followed. We (and our authorized third-party partners) use this information to make our website and the advertising displayed on it more relevant to your interests.</li>`;
  }

  typesContent += `</ul>`;

  sections.push({
    title: '3. Categories of Cookies We Deploy',
    content: typesContent,
  });

  // 4. Third-Party Cookies (conditional)
  if (thirdParties.length > 0) {
    const activeThirdParties = thirdParties
      .filter(p => thirdPartyLabels[p])
      .map(p => escapeHtml(thirdPartyLabels[p]));

    if (activeThirdParties.length > 0) {
      sections.push({
        title: '4. Third-Party Tracking Technologies',
        content: `
          <p>In addition to our own cookies, we may also use various authorized third-party cookies to report usage statistics, deliver advertisements, and facilitate payment gateways.</p>
          <p>Our approved third-party partners include: <strong>${activeThirdParties.join(', ')}</strong>.</p>
          <p>These third parties may utilize their own cookies to collect data about your online activities across different websites. We do not have direct control over these third-party cookies, and their use is governed by the respective privacy policies of those third parties.</p>`,
      });
    }
  }

  // 5. Consent and Control (DPDP Act Compliance)
  sections.push({
    title: '5. Your Consent and Control Rights',
    content: `
      <p>Under the <strong>DPDP Act, 2023</strong>, you have the right to provide, manage, and withdraw your consent regarding non-essential cookies (such as analytics and marketing cookies).</p>
      <p><strong>Managing via Browser Settings:</strong> You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer. However, disabling cookies may prevent you from taking full advantage of the website.</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome Cookie Settings</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Mozilla Firefox Cookie Settings</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari Cookie Settings</a></li>
      </ul>
      <p><strong>Withdrawing Consent:</strong> If you wish to withdraw your consent for non-essential tracking, you may clear your browser cookies or update your preferences via our on-site cookie banner.</p>`,
  });

  // 6. Contact Information
  sections.push({
    title: '6. Contact Us',
    content: `
      <p>If you have any questions, concerns, or requests regarding our use of cookies or this Cookie Policy, please contact our Data Protection/Grievance Officer at:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
      </p>`,
  });

  // ─── 5. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 6. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Cookie Policy',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This policy details how <strong>${businessName}</strong> utilizes tracking technologies to enhance user experience and maintain regulatory compliance under Indian law.</p>`,
  });

  // ─── 7. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 8. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    ...meityLaws.filter(l => l.name.includes('Information Technology Act') || l.name.includes('Personal Data Protection'))
  ];

  return {
    html,
    text,
    title: `Cookie Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'IN',
    },
  };
}