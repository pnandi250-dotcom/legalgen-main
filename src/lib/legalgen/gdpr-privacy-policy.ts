// ─── EU GDPR PRIVACY POLICY GENERATOR ──────────────────────────────────
// Comprehensive GDPR-compliant privacy policy generator for European Union

import type { FormData, GeneratedDocument, LawReference } from './types';
import { LAW_REGISTRY } from './types';

const EFFECTIVE_DATE = new Date().toLocaleDateString('en-GB', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric' 
});

const VERSION = '1.0.0 (GDPR Compliant)';

export function generateGDPRPrivacyPolicy(data: FormData): GeneratedDocument {
  const businessName = (data.businessName as string) || '[Your Business Name]';
  const websiteUrl = (data.websiteUrl as string) || '[Your Website URL]';
  const contactEmail = (data.email as string) || '[privacy@yourcompany.com]';
  
  const dpoName = (data.dpoName as string) || '';
  const dpoEmail = (data.dpoEmail as string) || contactEmail;
  const dpoPhone = (data.dpoPhone as string) || '';
  const dpoAddress = (data.dpoAddress as string) || '';
  const euRepName = (data.euRepresentativeName as string) || '';
  const euRepAddress = (data.euRepresentativeAddress as string) || '';
  const authority = (data.supervisoryAuthority as string) || '[Your National Data Protection Authority]';

  const dataCategories = [
    ...(Array.isArray(data.dataTypes) ? data.dataTypes : []).includes('name') ? ['Full name'] : [],
    ...(Array.isArray(data.dataTypes) ? data.dataTypes : []).includes('email') ? ['Email address'] : [],
    ...(Array.isArray(data.dataTypes) ? data.dataTypes : []).includes('phone') ? ['Phone number'] : [],
    ...(Array.isArray(data.dataTypes) ? data.dataTypes : []).includes('address') ? ['Postal/physical address'] : [],
    'Device and browser information',
    'Usage data (pages visited, features used)'
  ];

  const html = `
<div class="gdpr-privacy-policy" style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <header style="margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #003399;">
    <h1 style="color: #003399; font-size: 2.5em; margin-bottom: 10px;">Privacy Policy</h1>
    <p style="font-size: 1.1em; color: #666;"><strong>${businessName}</strong></p>
    <p style="font-size: 0.95em; color: #888;">Last Updated: ${EFFECTIVE_DATE} | Version: ${VERSION}</p>
    <div style="margin-top: 15px; padding: 10px; background: #f0f4ff; border-left: 4px solid #003399; font-size: 0.9em;">
      <strong>🇪🇺 GDPR Compliant</strong> | This privacy policy complies with the General Data Protection Regulation (GDPR) (EU) 2016/679
    </div>
  </header>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">1. Introduction</h2>
    <p>${businessName} ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website ${websiteUrl}.</p>
    <p>This policy complies with the <strong>General Data Protection Regulation (GDPR) (EU) 2016/679</strong>, the <strong>ePrivacy Directive</strong>, and other applicable EU data protection laws.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">2. Data Controller Information</h2>
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Business Name:</strong> ${businessName}</p>
      <p style="margin: 5px 0;"><strong>Website:</strong> <a href="${websiteUrl}" style="color: #003399;">${websiteUrl}</a></p>
      <p style="margin: 5px 0;"><strong>Contact Email:</strong> <a href="mailto:${contactEmail}" style="color: #003399;">${contactEmail}</a></p>
      ${dpoAddress ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${dpoAddress}</p>` : ''}
    </div>
    ${dpoName ? `
    <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #003399;">
      <h3 style="color: #003399; margin-top: 0;">Data Protection Officer (DPO)</h3>
      <p style="margin: 5px 0;"><strong>DPO Name:</strong> ${dpoName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${dpoEmail}" style="color: #003399;">${dpoEmail}</a></p>
      ${dpoPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${dpoPhone}</p>` : ''}
    </div>
    ` : ''}
    <p><strong>Supervisory Authority:</strong> ${authority}</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">3. Personal Data We Collect</h2>
    <ul style="padding-left: 25px;">
      ${dataCategories.map(cat => `<li style="margin: 8px 0;">${cat}</li>`).join('')}
    </ul>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">4. Legal Basis for Processing (Article 6)</h2>
    <div style="background: #f9f9f9; padding: 18px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #003399;">
      <h4 style="margin-top: 0; color: #003399;">Consent (Article 6(1)(a))</h4>
      <p>You have given clear, informed consent for processing your personal data.</p>
    </div>
    <div style="background: white; padding: 18px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #003399;">
      <h4 style="margin-top: 0; color: #003399;">Contract Performance (Article 6(1)(b))</h4>
      <p>Processing is necessary for contract performance or pre-contractual steps.</p>
    </div>
    <div style="background: #f9f9f9; padding: 18px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #003399;">
      <h4 style="margin-top: 0; color: #003399;">Legitimate Interests (Article 6(1)(f))</h4>
      <p>Processing is necessary for our legitimate interests (fraud prevention, security, service improvement).</p>
    </div>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">5. Your Rights Under GDPR</h2>
    <ol style="padding-left: 25px;">
      <li style="margin: 15px 0;"><strong>Right to Information</strong> - Clear, transparent information about data processing</li>
      <li style="margin: 15px 0;"><strong>Right of Access</strong> - Request copies of your personal data</li>
      <li style="margin: 15px 0;"><strong>Right to Rectification</strong> - Correct inaccurate data</li>
      <li style="margin: 15px 0;"><strong>Right to Erasure ("Right to be Forgotten")</strong> - Request deletion of your data</li>
      <li style="margin: 15px 0;"><strong>Right to Restrict Processing</strong> - Limit how we process your data</li>
      <li style="margin: 15px 0;"><strong>Right to Data Portability</strong> - Receive data in machine-readable format</li>
      <li style="margin: 15px 0;"><strong>Right to Object</strong> - Object to processing based on legitimate interests or direct marketing</li>
    </ol>
    <p><strong>Exercise Your Rights:</strong> Contact us at <a href="mailto:${dpoEmail}" style="color: #003399;">${dpoEmail}</a>. We respond within one month.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">6. Cookies (ePrivacy Directive)</h2>
    <p>We use cookies in compliance with the ePrivacy Directive. Types include:</p>
    <ul style="padding-left: 25px;">
      <li><strong>Essential Cookies:</strong> Required for site functionality (no consent needed)</li>
      <li><strong>Analytics Cookies:</strong> Help us understand visitor behavior (consent required)</li>
      <li><strong>Marketing Cookies:</strong> For targeted advertising (consent required)</li>
    </ul>
    <p>Manage preferences via our cookie banner or browser settings.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">7. Data Security (Article 32)</h2>
    <p>We implement appropriate security measures including encryption, access controls, regular testing, and staff training. Breaches are reported to supervisory authorities within 72 hours.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003399; font-size: 1.8em;">8. Contact Us</h2>
    <div style="background: #f0f4ff; padding: 25px; border-radius: 8px;">
      <p style="margin: 10px 0; font-size: 1.1em;"><strong>${businessName}</strong></p>
      ${dpoName ? `<p style="margin: 10px 0;">Attn: DPO - ${dpoName}</p>` : ''}
      <p style="margin: 10px 0;">📧 <a href="mailto:${dpoEmail}" style="color: #003399; font-weight: 600;">${dpoEmail}</a></p>
      ${dpoPhone ? `<p style="margin: 10px 0;">📞 ${dpoPhone}</p>` : ''}
      <p style="margin: 10px 0;">🌐 <a href="${websiteUrl}" style="color: #003399;">${websiteUrl}</a></p>
    </div>
  </section>

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; font-size: 0.9em;">
    <p>This Privacy Policy complies with GDPR (EU) 2016/679. Last updated: ${EFFECTIVE_DATE}</p>
    <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
  </footer>
</div>
  `;

  const text = html.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  
  const laws: LawReference[] = [...(LAW_REGISTRY['EU-GDPR'] || [])];

  return {
    html,
    text,
    title: `Privacy Policy - ${businessName} (GDPR Compliant)`,
    complianceInfo: { laws, lastUpdated: EFFECTIVE_DATE, jurisdiction: 'EU' }
  };
}