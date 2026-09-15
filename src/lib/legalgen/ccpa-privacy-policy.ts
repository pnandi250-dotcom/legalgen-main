// ─── USA CCPA/CPRA PRIVACY POLICY GENERATOR ───────────────────────────────
// California Consumer Privacy Act compliant generator

import type { FormData, GeneratedDocument, LawReference } from './types';
import { LAW_REGISTRY } from './types';

const EFFECTIVE_DATE = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
const VERSION = '1.0.0 (CCPA/CPRA Compliant)';

export function generateCCPAPrivacyPolicy(data: FormData): GeneratedDocument {
  const businessName = (data.businessName as string) || '[Your Business Name]';
  const websiteUrl = (data.websiteUrl as string) || '[Your Website URL]';
  const contactEmail = (data.email as string) || '[privacy@yourcompany.com]';
  const privacyContact = (data.privacyContactName as string) || '';

  const html = `
<div class="ccpa-privacy-policy" style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <header style="margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1E40AF;">
    <h1 style="color: #1E40AF; font-size: 2.5em; margin-bottom: 10px;">Privacy Policy</h1>
    <p style="font-size: 1.1em; color: #666;"><strong>${businessName}</strong></p>
    <p style="font-size: 0.95em; color: #888;">Last Updated: ${EFFECTIVE_DATE} | Version: ${VERSION}</p>
    <div style="margin-top: 15px; padding: 10px; background: #EFF6FF; border-left: 4px solid #1E40AF; font-size: 0.9em;">
      <strong>🇺🇸 California Compliant</strong> | CCPA & CPRA Compliant
    </div>
  </header>

  <section style="margin-bottom: 35px; background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px;">
    <h2 style="color: #92400E; margin-top: 0;">📋 California Notice at Collection (CCPA Required)</h2>
    <p><strong>California Residents:</strong> We collect categories of personal information including identifiers (name, email, address), internet activity, geolocation, and inferences. Purposes: operating services, improving user experience, marketing (with consent), security, and legal compliance.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #1E40AF; font-size: 1.8em;">1. Introduction</h2>
    <p>${businessName} respects your privacy. This policy complies with the <strong>CCPA</strong>, <strong>CPRA</strong>, and <strong>CalOPPA</strong>.</p>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #1E40AF; font-size: 1.8em;">2. Information We Collect</h2>
    <ul style="padding-left: 25px;">
      <li><strong>Identifiers:</strong> Name, email, address, IP address, customer ID</li>
      <li><strong>Geolocation Data:</strong> Location from IP address or GPS</li>
      <li><strong>Commercial Information:</strong> Purchase history, preferences</li>
      <li><strong>Internet Activity:</strong> Browsing history, search history, interactions</li>
      <li><strong>Inferences:</strong> Preferences, behavioral profiling</li>
    </ul>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #1E40AF; font-size: 1.8em;">3. Sharing & Selling Personal Information</h2>
    <div style="background: #D1FAE5; border: 2px solid #059669; padding: 20px; border-radius: 8px;">
      <h4 style="margin-top: 0; color: #065F46;">✅ We Do Not Sell or Share Personal Information</h4>
      <p>We do not sell or share your personal information as defined by CCPA/CPRA.</p>
    </div>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #1E40AF; font-size: 1.8em;">4. Your California Privacy Rights</h2>
    
    <details style="margin: 15px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;" open>
      <summary style="padding: 15px; background: #f9f9f9; cursor: pointer; font-weight: 600; color: #1E40AF;">
        Right to Know (CCPA §1798.100)
      </summary>
      <div style="padding: 15px; background: white; border-top: 1px solid #e0e0e0;">
        <p>Request disclosure of personal information collected in the past 12 months.</p>
        <p><strong>How to exercise:</strong> Email ${contactEmail} with "CCPA Request" in subject. Response within 45 days.</p>
      </div>
    </details>

    <details style="margin: 15px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <summary style="padding: 15px; background: white; cursor: pointer; font-weight: 600; color: #1E40AF;">
        Right to Delete (CCPA §1798.105)
      </summary>
      <div style="padding: 15px; background: #f9f9f9; border-top: 1px solid #e0e0e0;">
        <p>Request deletion of your personal information.</p>
        <p><strong>How to exercise:</strong> Email ${contactEmail}. We delete within 45 days unless legal exception applies.</p>
      </div>
    </details>

    <details style="margin: 15px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <summary style="padding: 15px; background: #f9f9f9; cursor: pointer; font-weight: 600; color: #1E40AF;">
        Right to Opt-Out of Sale/Sharing (CCPA §1798.120)
      </summary>
      <div style="padding: 15px; background: white; border-top: 1px solid #e0e0e0;">
        <p>Direct us not to "sell" or "share" your personal information.</p>
        <p><strong>How to exercise:</strong> Click "DO NOT SELL OR SHARE MY PERSONAL INFORMATION" below, or email us.</p>
      </div>
    </details>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #1E40AF; font-size: 1.8em;">5. Do Not Sell or Share My Personal Information</h2>
    <div style="background: #EFF6FF; border: 2px solid #3B82F6; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1E40AF;">Opt-Out of Sale/Sharing</h3>
      <button onclick="window.dispatchEvent(new CustomEvent('ccpa-opt-out'))" style="background: #1E40AF; color: white; border: none; padding: 15px 30px; font-size: 1.1em; border-radius: 8px; cursor: pointer;">
        🔒 DO NOT SELL OR SHARE MY PERSONAL INFORMATION
      </button>
      <p style="margin: 15px 0 0 0; font-size: 0.9em; color: #666;">This setting applies to this browser. Change anytime.</p>
    </div>
  </section>

  <section style="margin-bottom: 35px;">
    <h2 style="color: #1E40AF; font-size: 1.8em;">6. Contact Us</h2>
    <div style="background: #EFF6FF; padding: 25px; border-radius: 8px;">
      <p style="margin: 10px 0; font-size: 1.1em;"><strong>${businessName}</strong></p>
      ${privacyContact ? `<p style="margin: 10px 0;">Attn: Privacy - ${privacyContact}</p>` : ''}
      <p style="margin: 10px 0;">📧 <a href="mailto:${contactEmail}" style="color: #1E40AF; font-weight: 600;">${contactEmail}</a></p>
      <p style="margin: 10px 0;">🌐 <a href="${websiteUrl}" style="color: #1E40AF;">${websiteUrl}</a></p>
    </div>
    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0;"><strong>To Lodge a Complaint:</strong> California Privacy Protection Agency (CPPA): <a href="https://cppa.ca.gov/" target="_blank" style="color: #1E40AF;">cppa.ca.gov</a></p>
    </div>
  </section>

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; font-size: 0.9em;">
    <p>Complies with CCPA & CPRA. Last updated: ${EFFECTIVE_DATE}</p>
    <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
  </footer>
</div>
  `;

  const text = html.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const laws: LawReference[] = [...(LAW_REGISTRY['US-California'] || [])];

  return {
    html,
    text,
    title: `Privacy Policy - ${businessName} (CCPA/CPRA Compliant)`,
    complianceInfo: { laws, lastUpdated: EFFECTIVE_DATE, jurisdiction: 'US-CA' }
  };
}