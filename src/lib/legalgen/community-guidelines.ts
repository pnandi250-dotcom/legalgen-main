// src/lib/legalgen/community-guidelines.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateCommunityGuidelines(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  const hasMinors = !!data.hasMinors; // Does the platform allow users under 18?

  // ─── 3. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction
  sections.push({
    title: '1. Welcome to Our Community',
    content: `
      <p>Welcome to <strong>${businessName}</strong>. We are committed to fostering a safe, inclusive, and respectful environment for all our users. These Community Guidelines outline the acceptable behaviors and the type of content that is prohibited on our platform.</p>
      <p>By using our platform, you agree to abide by these guidelines, our Terms of Service, and all applicable laws of India. Violating these guidelines may result in content removal, account suspension, or permanent banning.</p>`,
  });

  // 2. Safety and Respect
  sections.push({
    title: '2. Safety, Respect, and Zero Tolerance',
    content: `
      <p>We have a zero-tolerance policy for behaviors that threaten the safety and well-being of our community members:</p>
      <ul>
        <li><strong>Harassment and Bullying:</strong> Do not engage in targeted harassment, bullying, doxxing (sharing private personal information), or inciting others to do so.</li>
        <li><strong>Hate Speech:</strong> We strictly prohibit content that promotes violence, discrimination, or hatred against individuals or groups based on race, ethnicity, religion, caste, disability, age, nationality, sexual orientation, or gender identity.</li>
        <li><strong>Threats and Violence:</strong> Do not post content that threatens violence, promotes self-harm, or encourages illegal acts under the <strong>Bharatiya Nyaya Sanhita (BNS), 2023</strong>.</li>
      </ul>`,
  });

  // 3. Child Safety (conditional)
  if (hasMinors) {
    sections.push({
      title: '3. Child Safety and Protection',
      content: `
        <p>Protecting minors is our highest priority. We strictly comply with the <strong>Protection of Children from Sexual Offences (POCSO) Act, 2012</strong>.</p>
        <p>Any content that exploits, endangers, or sexualizes minors is strictly prohibited. If we detect such content, we will immediately remove it, permanently ban the user, and report the incident to the local police (as mandated under Section 19 of the POCSO Act, 2012), the National Commission for Protection of Child Rights (NCPCR), and via India's National Cyber Crime Reporting Portal at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a>.</p>`,
    });
  }

  // 4. IT Rules 2021 (Crucial for Indian Intermediaries)
  sections.push({
    title: `4. Prohibited Content (IT Rules 2021)`,
    content: `
      <p>As a digital intermediary, we mandate strict compliance with <strong>Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>. You must <strong>NOT</strong> host, display, upload, modify, publish, transmit, store, update, or share any information that:</p>
      <ul>
        <li>Belongs to another person and to which you do not have any right;</li>
        <li>Is defamatory, obscene, pornographic, pedophilic, invasive of another's privacy (including bodily privacy), insulting or harassing on the basis of gender, libelous, racially or ethnically objectionable, or promotes money laundering or gambling;</li>
        <li>Is harmful to children;</li>
        <li>Infringes any patent, trademark, copyright, or other proprietary rights;</li>
        <li>Violates any law for the time being in force;</li>
        <li>Deceives or misleads the addressee about the origin of the message, or knowingly and intentionally communicates any information which is patently false or misleading in nature;</li>
        <li>Impersonates another person;</li>
        <li>Threatens the unity, integrity, defense, security, or sovereignty of India, friendly relations with foreign States, or public order, or causes incitement to the commission of any cognizable offense or prevents investigation of any offense.</li>
      </ul>`,
  });

  // 5. Intellectual Property
  sections.push({
    title: '5. Intellectual Property Rights',
    content: `
      <p>Respect the original creations of others. Do not post content that infringes upon anyone's copyright, trademark, or other intellectual property rights. We process all valid takedown requests in accordance with the <strong>Copyright Act, 1957</strong>.</p>`,
  });

  // 6. Spam, Scams, and Integrity
  sections.push({
    title: '6. Spam, Scams, and Platform Integrity',
    content: `
      <p>To maintain a high-quality experience, the following deceptive practices are prohibited:</p>
      <ul>
        <li><strong>Spam:</strong> Do not post repetitive, unwanted, or unsolicited promotional content.</li>
        <li><strong>Scams and Fraud:</strong> Do not use the platform to conduct phishing, financial scams, pyramid schemes, or any fraudulent activities.</li>
        <li><strong>Impersonation and Fake News:</strong> Do not create fake accounts to impersonate individuals or brands. Do not intentionally spread misinformation or "fake news" that could cause public harm or panic.</li>
      </ul>`,
  });

  // 7. Enforcement & Moderation
  sections.push({
    title: '7. Moderation and Enforcement',
    content: `
      <p>We utilize a combination of automated systems and human moderators to enforce these guidelines. Depending on the severity of the violation, we may take the following actions:</p>
      <ul>
        <li>Remove the violating content without prior notice.</li>
        <li>Issue a warning to the user.</li>
        <li>Temporarily suspend the user's account and restrict access to certain features.</li>
        <li>Permanently disable the user's account.</li>
        <li>Report the user to law enforcement agencies if the activity involves illegal acts under Indian law.</li>
      </ul>`,
  });

  // 8. Reporting & Grievance
  sections.push({
    title: '8. Reporting Violations & Grievance Redressal',
    content: `
      <p>We rely on our community to help keep the platform safe. If you see content or behavior that violates these guidelines, please use our in-app reporting tools or contact our moderation team.</p>
      <p>In compliance with the IT Rules 2021, if you have a formal grievance regarding content moderation, impersonation, or safety, please contact our designated Grievance Officer at:</p>
      <p>
        <strong>${businessName} Grievance Officer</strong><br>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
      </p>
      <p>We aim to acknowledge complaints within 24 hours and resolve them within 15 days, as mandated by law.</p>`,
  });

  // ─── 4. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 5. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Community Guidelines',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>These guidelines dictate the expected behavior and content standards for all users engaging on the <strong>${businessName}</strong> platform.</p>`,
  });

  // ─── 6. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 7. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    ...meityLaws.filter(l => l.name.includes('Information Technology Act') || l.name.includes('Intermediary Guidelines')),
    { name: "Bharatiya Nyaya Sanhita (BNS), 2023", department: "Law & Justice", url: "https://www.mha.gov.in/" },
    { name: "POCSO Act, 2012", department: "Women & Child Development", url: "https://wcd.nic.in/act/protection-children-sexual-offences-pocso-act-2012" }
  ];

  return {
    html,
    text,
    title: `Community Guidelines - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'India',
    },
  };
}