// ─── UK GDPR + DPA 2018 PRIVACY POLICY GENERATOR ──────────────────────────

import type { FormData, GeneratedDocument, LawReference } from './types';
import { LAW_REGISTRY } from './types';

const EFFECTIVE_DATE = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const VERSION = '1.0.0 (UK GDPR Compliant)';

export function generateUKPrivacyPolicy(data: FormData): GeneratedDocument {
  const businessName = (data.businessName as string) || '[Your Business Name]';
  const websiteUrl = (data.websiteUrl as string) || '[Your Website URL]';
  const contactEmail = (data.email as string) || '[privacy@yourcompany.com]';
  const dpoName = (data.dpoName as string) || '';
  const dpoEmail = (data.dpoEmail as string) || contactEmail;
  const dpoPhone = (data.dpoPhone as string) || '';
  const dpoAddress = (data.dpoAddress as string) || '';

  const html = `
<div class="uk-privacy-policy" style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <header style="margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #003366;">
    <h1 style="color: #003366; font-size: 2.5em; margin-bottom: 10px;">Privacy Policy</h1>
    <p style="font-size: 1.1em; color: #666;"><strong>${businessName}</strong></p>
    <p style="font-size: 0.95em; color: #888;">Last Updated: ${EFFECTIVE_DATE} | Version: ${VERSION}</p>
    <div style="margin-top: 15px; padding: 10px; background: #f0f4ff; border-left: 4px solid #003366; font-size: 0.9em;">
      <strong>🇬🇧 UK Compliant</strong> | UK GDPR, Data Protection Act 2018, PECR
    </div>
  </header>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">1. Introduction</h2>
    <p>${businessName} is committed to protecting your privacy. This policy complies with the <strong>UK GDPR</strong>, <strong>Data Protection Act 2018</strong>, and <strong>PECR</strong>.</p>
    <p>We are registered with the <strong>Information Commissioner's Office (ICO)</strong>.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">2. Data Controller Information</h2>
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 5px 0;"><strong>Business Name:</strong> ${businessName}</p>
      <p style="margin: 5px 0;"><strong>Website:</strong> <a href="${websiteUrl}" style="color: #003366;">${websiteUrl}</a></p>
      <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${contactEmail}" style="color: #003366;">${contactEmail}</a></p>
    </div>
    ${dpoName ? `
    <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #003366;">
      <h3 style="color: #003366; margin-top: 0;">Data Protection Officer / Contact</h3>
      <p style="margin: 5px 0;"><strong>Name:</strong> ${dpoName}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${dpoEmail}" style="color: #003366;">${dpoEmail}</a></p>
      ${dpoPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${dpoPhone}</p>` : ''}
    </div>
    ` : ''}
    <p><strong>ICO Contact:</strong> <a href="https://ico.org.uk/" target="_blank" style="color: #003366;">ico.org.uk</a> | 📞 0303 123 1113</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">3. Personal Data We Collect</h2>
    <ul style="padding-left: 25px;">
      <li>Full name, email address, phone number</li>
      <li>Postal/physical address</li>
      <li>Payment/banking information</li>
      <li>Device and browser information</li>
      <li>Usage data (pages visited, features used)</li>
      <li>Cookies and similar technologies</li>
    </ul>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">4. Legal Basis for Processing (Article 6)</h2>
    <div style="background: #f9f9f9; padding: 18px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #003366;">
      <h4 style="margin-top: 0; color: #003366;">Consent (Article 6(1)(a))</h4>
      <p>Clear, informed, specific, unambiguous consent for processing.</p>
    </div>
    <div style="background: white; padding: 18px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #003366;">
      <h4 style="margin-top: 0; color: #003366;">Contract (Article 6(1)(b))</h4>
      <p>Necessary for contract performance or pre-contractual steps.</p>
    </div>
    <div style="background: #f9f9f9; padding: 18px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #003366;">
      <h4 style="margin-top: 0; color: #003366;">Legitimate Interests (Article 6(1)(f))</h4>
      <p>Fraud prevention, security, service improvement, marketing (with opt-out).</p>
    </div>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">5. Your Rights Under UK GDPR</h2>
    <ol style="padding-left: 25px;">
      <li style="margin: 15px 0;"><strong>Right to be Informed</strong> - Transparent information about processing</li>
      <li style="margin: 15px 0;"><strong>Right of Access (Subject Access Request)</strong> - Request copies of your data</li>
      <li style="margin: 15px 0;"><strong>Right to Rectification</strong> - Correct inaccurate data</li>
      <li style="margin: 15px 0;"><strong>Right to Erasure</strong> - Request deletion ("Right to be Forgotten")</li>
      <li style="margin: 15px 0;"><strong>Right to Restrict Processing</strong> - Limit processing in certain cases</li>
      <li style="margin: 15px 0;"><strong>Right to Data Portability</strong> - Receive data in machine-readable format</li>
      <li style="margin: 15px 0;"><strong>Right to Object</strong> - Object to legitimate interests or marketing</li>
    </ol>
    <p><strong>Response Time:</strong> Within one month (can extend by two months for complex requests).</p>
    <p><strong>Exercise Rights:</strong> Contact <a href="mailto:${dpoEmail}" style="color: #003366;">${dpoEmail}</a>.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">6. Cookies (PECR)</h2>
    <p>In accordance with PECR, we use cookies:</p>
    <ul style="padding-left: 25px;">
      <li><strong>Essential:</strong> Required for functionality (no consent needed)</li>
      <li><strong>Analytics:</strong> Usage statistics (consent required)</li>
      <li><strong>Marketing:</strong> Targeted advertising (consent required)</li>
    </ul>
    <p>Manage via cookie banner or <a href="https://www.youronlinechoices.com/" target="_blank" style="color: #003366;">www.youronlinechoices.com</a>.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">7. International Transfers</h2>
    <p>Your data may transfer outside the UK. Mechanisms:</p>
    <ul style="padding-left: 25px;">
      <li><strong>EU/EEA:</strong> UK adequacy decision allows free flow</li>
      <li><strong>Other countries:</strong> Standard Contractual Clauses (SCCs/IDTAs)</li>
      <li><strong>USA:</strong> UK Extension to EU-US Data Privacy Framework where applicable</li>
    </ul>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #003366; font-size: 1.8em;">8. Contact Us</h2>
    <div style="background: #f0f4ff; padding: 25px; border-radius: 8px;">
      <p style="margin: 10px 0; font-size: 1.1em;"><strong>${businessName}</strong></p>
      ${dpoName ? `<p style="margin: 10px 0;">Attn: DPO - ${dpoName}</p>` : ''}
      <p style="margin: 10px 0;">📧 <a href="mailto:${dpoEmail}" style="color: #003366; font-weight: 600;">${dpoEmail}</a></p>
      ${dpoPhone ? `<p style="margin: 10px 0;">📞 ${dpoPhone}</p>` : ''}
      <p style="margin: 10px 0;">🌐 <a href="${websiteUrl}" style="color: #003366;">${websiteUrl}</a></p>
    </div>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0;"><strong>ICO Complaints:</strong> <a href="https://ico.org.uk/make-a-complaint/" target="_blank" style="color: #003366;">ico.org.uk/make-a-complaint</a> | 📞 0303 123 1113</p>
    </div>
  </section>

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; font-size: 0.9em;">
    <p>Complies with UK GDPR, DPA 2018, PECR. Last updated: ${EFFECTIVE_DATE}</p>
    <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
  </footer>
</div>
  `;

  const text = html.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const laws: LawReference[] = [...(LAW_REGISTRY['UK-ICO'] || [])];

  return {
    html,
    text,
    title: `Privacy Policy - ${businessName} (UK GDPR Compliant)`,
    complianceInfo: { laws, lastUpdated: EFFECTIVE_DATE, jurisdiction: 'UK' }
  };
}