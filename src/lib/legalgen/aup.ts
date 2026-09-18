// src/lib/legalgen/aup.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateAup(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // ─── 2. BOOLEAN FLAGS ─────────────────────────────────────────────────
  const hasUserGeneratedContent = !!data.userGeneratedContent;
  const isSaaS = !!data.isSaaS;

  // ─── 3. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction
  sections.push({
    title: '1. Introduction and Scope',
    content: `
      <p>This Acceptable Use Policy ("AUP") outlines the acceptable and prohibited behaviors and usages of the services, applications, and networks (collectively, the "Services") provided by <strong>${businessName}</strong> ("we," "us," or "our").</p>
      <p>This AUP is incorporated by reference into our Terms of Service. By accessing or utilizing our Services, you agree to comply with this AUP. If you violate this policy, we reserve the right to suspend or terminate your access to the Services without notice or refund.</p>`,
  });

  // 2. Illegal & Prohibited Activities
  sections.push({
    title: '2. Prohibited and Illegal Activities',
    content: `
      <p>You may not use our Services to engage in, foster, or promote illegal, abusive, or irresponsible behavior, including but not limited to:</p>
      <ul>
        <li>Any activity or conduct that is likely to be in breach of any applicable laws, codes, or regulations, including the <strong>Information Technology Act, 2000</strong>.</li>
        <li>Unauthorized access to or use of data, systems, or networks, including any attempt to probe, scan, or test the vulnerability of a system or network (hacking/cracking).</li>
        <li>Interfering with service to any user, host, or network, including mail bombing, flooding, deliberate attempts to overload a system, and broadcast attacks (DDoS).</li>
        <li>Forging any TCP-IP packet header or any part of the header information in an email or a newsgroup posting.</li>
        <li>Conducting or promoting fraudulent operations, ponzi schemes, or illegal gambling.</li>
      </ul>`,
  });

  // 3. Content Standards (IT Rules 2021)
  if (hasUserGeneratedContent || isSaaS) {
    sections.push({
      title: '3. Content Standards and Restrictions',
      content: `
        <p>In strict compliance with <strong>Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>, you agree not to host, display, upload, modify, publish, transmit, store, update or share any content that:</p>
        <ul>
          <li>Belongs to another person and to which you do not have any right.</li>
          <li>Is defamatory, obscene, pornographic, pedophilic, invasive of another's privacy (including bodily privacy), insulting or harassing on the basis of gender, libelous, racially or ethnically objectionable, or promotes money laundering or gambling.</li>
          <li>Is harmful to children in any way.</li>
          <li>Infringes any patent, trademark, copyright, or other proprietary rights.</li>
          <li>Violates any law for the time being in force.</li>
          <li>Deceives or misleads the addressee about the origin of the message or knowingly and intentionally communicates any information which is patently false or misleading in nature but may reasonably be perceived as a fact.</li>
          <li>Impersonates another person.</li>
          <li>Threatens the unity, integrity, defense, security or sovereignty of India, friendly relations with foreign States, or public order.</li>
        </ul>`,
    });
  }

  // 4. System and Network Security
  sections.push({
    title: '4. System and Network Abuse',
    content: `
      <p>Violations of system or network security are strictly prohibited and may result in criminal and civil liability. We will investigate incidents involving such violations and may involve, and cooperate with, law enforcement authorities (such as CERT-In) if a criminal violation is suspected.</p>
      <p>Examples of system and network abuse include:</p>
      <ul>
        <li><strong>Malware:</strong> Distributing viruses, worms, Trojan horses, or any other malicious code or software.</li>
        <li><strong>Scraping and Automation:</strong> Using automated systems, scripts, bots, spiders, or scrapers to access, copy, or extract data from our Services without our express written permission.</li>
        <li><strong>Bypassing Limits:</strong> Attempting to bypass, exploit, or circumvent any usage limits, rate limits, or billing mechanisms of the Services.</li>
      </ul>`,
  });

  // 5. Spam and Email Abuse (Crucial for SaaS/Marketing)
  sections.push({
    title: '5. Spam and Electronic Communications Abuse',
    content: `
      <p>You are strictly prohibited from using our Services to transmit unauthenticated or unsolicited bulk email ("Spam"). All email sent via our Services must comply with generally accepted email industry standards and any applicable provisions of the Information Technology Act, 2000 relating to unauthorized or fraudulent electronic communication.</p>
      <ul>
        <li>You must not send emails to individuals who have not explicitly opted-in to receive communications from you.</li>
        <li>You must not disguise or forge the routing information or originating address of your emails.</li>
        <li>You must include a functioning, easily visible "unsubscribe" or opt-out mechanism in all marketing communications.</li>
      </ul>`,
  });

  // 6. Enforcement and Incident Reporting
  sections.push({
    title: '6. Enforcement and Termination',
    content: `
      <p>We retain the absolute right, but not the obligation, to investigate any suspected violation of this AUP. In the event of a breach, we may take any of the following actions at our sole discretion:</p>
      <ul>
        <li>Issue warnings;</li>
        <li>Suspend or throttle your network access or account privileges;</li>
        <li>Permanently terminate your account and Services without refund;</li>
        <li>Remove or block access to any offending content;</li>
        <li>Report the activity to appropriate law enforcement agencies or regulatory bodies in India.</li>
      </ul>`,
  });

  // 7. Contact Information
  sections.push({
    title: '7. Reporting Violations',
    content: `
      <p>If you become aware of any violation of this Acceptable Use Policy by any person, including users that have accessed our Services, please notify us immediately at:</p>
      <p>
        <strong>${businessName}</strong><br>
        <strong>Abuse Contact:</strong> <a href="mailto:${email}">${email}</a>
      </p>`,
  });

  // ─── 4. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 5. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Acceptable Use Policy (AUP)',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This Acceptable Use Policy outlines the rules and guidelines that govern your use of the services provided by <strong>${businessName}</strong>.</p>`,
  });

  // ─── 6. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 7. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    ...meityLaws.filter(l => l.name.includes('Information Technology Act') || l.name.includes('Intermediary Guidelines'))
  ];

  return {
    html,
    text,
    title: `Acceptable Use Policy - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
            jurisdiction: 'IN',
    },
  };
}