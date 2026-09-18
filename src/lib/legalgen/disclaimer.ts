// src/lib/legalgen/disclaimer.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateDisclaimer(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const industry = escapeHtml((data.industry as string) || 'general');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  // These would typically come from your questionnaire
  const hasAffiliateLinks = !!data.hasAffiliateLinks;
  const hasTestimonials = !!data.hasTestimonials;

  // Check if the industry typically requires strict professional disclaimers
  const requiresProfessionalDisclaimer = ['healthtech', 'fintech', 'legal', 'medical'].includes(industry.toLowerCase());

  // ─── 3. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. General Information Disclaimer
  sections.push({
    title: '1. General Information Disclaimer',
    content: `
      <p>The information provided by <strong>${businessName}</strong> ("we," "us," or "our") on <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer">${websiteUrl}</a> (the "Website") is for general informational and educational purposes only.</p>
      <p>All information on the Website is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Website.</p>
      <p>UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE WEBSITE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE WEBSITE. YOUR USE OF THE WEBSITE AND YOUR RELIANCE ON ANY INFORMATION ON THE WEBSITE IS SOLELY AT YOUR OWN RISK.</p>`,
  });

  // 2. Professional Advice Disclaimer (conditional)
  if (requiresProfessionalDisclaimer) {
    let professionType = "Professional";
    if (industry.toLowerCase() === 'healthtech' || industry.toLowerCase() === 'medical') professionType = "Medical/Health";
    if (industry.toLowerCase() === 'fintech') professionType = "Financial/Investment";
    if (industry.toLowerCase() === 'legal') professionType = "Legal";

    const emergencyNotice = (industry.toLowerCase() === 'healthtech' || industry.toLowerCase() === 'medical')
      ? `<p><strong>If you are experiencing a medical emergency, call your local emergency services or go to the nearest hospital immediately. Do not rely on this Website for emergency medical needs.</strong></p>`
      : '';

    sections.push({
      title: `2. No ${professionType} Advice`,
      content: `
        <p>The Website cannot and does not contain ${professionType.toLowerCase()} advice. The ${professionType.toLowerCase()} information is provided for general informational and educational purposes only and is not a substitute for professional advice.</p>
        <p>Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals. We do not provide any kind of ${professionType.toLowerCase()} advice.</p>
        ${emergencyNotice}
        <p><strong>THE USE OR RELIANCE OF ANY INFORMATION CONTAINED ON THIS WEBSITE IS SOLELY AT YOUR OWN RISK.</strong></p>`,
    });
  }

  // 3. External Links Disclaimer
  sections.push({
    title: '3. External Links Disclaimer',
    content: `
      <p>The Website may contain (or you may be sent through the Website) links to other websites or content belonging to or originating from third parties, or links to websites and features in banners or other advertising.</p>
      <p>Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR THE ACCURACY OR RELIABILITY OF ANY INFORMATION OFFERED BY THIRD-PARTY WEBSITES LINKED THROUGH THE WEBSITE.</p>
      <p>We will not be a party to or in any way be responsible for monitoring any transaction between you and third-party providers of products or services.</p>`,
  });

  // 4. Affiliates Disclaimer (conditional)
  if (hasAffiliateLinks) {
    sections.push({
      title: '4. Affiliates Disclaimer',
      content: `
        <p>The Website may contain links to affiliate websites, and we may receive an affiliate commission for any purchases made by you on the affiliate website using such links.</p>
        <p>Our participation in affiliate programs does not influence our content, reviews, or recommendations. We only recommend products or services that we believe provide value to our users.</p>
        <p>In accordance with the <strong>Consumer Protection Act, 2019</strong> and applicable guidelines on prevention of misleading advertisements, we explicitly disclose our financial relationship with these affiliate partners.</p>`,
    });
  }

  // 5. Testimonials Disclaimer (conditional)
  if (hasTestimonials) {
    sections.push({
      title: '5. Testimonials & Reviews Disclaimer',
      content: `
        <p>The Website may contain testimonials, reviews, or endorsements by users of our products and/or services. These testimonials reflect the real-life experiences and opinions of such users.</p>
        <p>However, the experiences are personal to those particular users, and may not necessarily be representative of all users of our products and/or services. We do not claim, and you should not assume, that all users will have the same experiences. YOUR INDIVIDUAL RESULTS MAY VARY.</p>
        <p>The testimonials on the Website are submitted in various forms such as text, audio, and/or video, and are reviewed by us before being posted. They appear on the Website verbatim as given by the users, except for the correction of grammar or typing errors.</p>
        <p>The views and opinions contained in the testimonials belong solely to the individual user and do not reflect our views and opinions.</p>`,
    });
  }

  // 6. Errors and Omissions
  sections.push({
    title: '6. Errors and Omissions',
    content: `
      <p>While we strive to ensure that the information on this Website is up-to-date and accurate, we assume no responsibility for any errors, omissions, or inaccuracies in the content provided.</p>
      <p>The information contained on the Website is provided on an "as is" basis with no guarantees of completeness, accuracy, usefulness, or timeliness.</p>`,
  });

  // 7. Fair Use Disclaimer
  sections.push({
    title: '7. Fair Use Notice',
    content: `
      <p>The Website may contain copyrighted material the use of which has not always been specifically authorized by the copyright owner. We are making such material available for criticism, comment, news reporting, teaching, scholarship, or research.</p>
      <p>We believe this constitutes a "fair dealing" of any such copyrighted material as provided for in <strong>Section 52 of the Copyright Act, 1957</strong> of India. If you wish to use copyrighted material from the Website for purposes of your own that go beyond fair use, you must obtain permission from the copyright owner.</p>`,
  });

  // 8. Contact Information
  sections.push({
    title: '8. Contact Us',
    content: `
      <p>If you require any more information or have any questions about our site's disclaimer, please feel free to contact us by email at:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
      </p>`,
  });

  // ─── 4. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 5. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Disclaimer',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>Please read this disclaimer carefully before using the <strong>${businessName}</strong> website.</p>`,
  });

  // ─── 6. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 7. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];
  const consumerLaws = LAW_REGISTRY['Consumer Affairs'] || [];

  const relevantLaws = [
    ...meityLaws.filter(l => l.name.includes('Information Technology')),
    ...consumerLaws.filter(l => l.name.includes('Consumer Protection'))
  ];

  return {
    html,
    text,
    title: `Disclaimer - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'IN',
    },
  };
}