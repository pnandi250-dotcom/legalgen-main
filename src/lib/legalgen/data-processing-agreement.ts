// src/lib/legalgen/data-processing-agreement.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateDataProcessingAgreement(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');
  const governingState = escapeHtml((data.governingState as string) || 'Delhi');

  // ─── 2. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction and Definitions
  sections.push({
    title: '1. Introduction and Definitions',
    content: `
      <p>This Data Processing Agreement ("DPA") forms an integral part of the Master Service Agreement or Terms of Service between the Customer ("Data Fiduciary" or "Data Controller") and <strong>${businessName}</strong> ("Data Processor").</p>
      <p>This DPA governs the processing of personal data by the Data Processor on behalf of the Data Fiduciary, ensuring strict compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023 (India)</strong>, and where applicable, the General Data Protection Regulation (GDPR).</p>
      <ul>
        <li><strong>"Personal Data"</strong> means any data about an individual who is identifiable by or in relation to such data.</li>
        <li><strong>"Data Principal" / "Data Subject"</strong> means the individual to whom the personal data relates.</li>
        <li><strong>"Data Fiduciary" / "Controller"</strong> means any person who alone or in conjunction with others determines the purpose and means of processing personal data.</li>
      </ul>`,
  });

  // 2. Scope and Nature of Processing
  sections.push({
    title: '2. Scope and Nature of Processing',
    content: `
      <p>The Data Processor shall process Personal Data solely on behalf of and according to the documented instructions of the Data Fiduciary, as necessary to provide the services outlined in the primary agreement.</p>
      <p>The Data Processor shall not process Personal Data for its own purposes, sell the data, or use it for targeted advertising without explicit written authorization from the Data Fiduciary.</p>
      <p>If the Data Processor believes that an instruction infringes the DPDP Act or other applicable data protection laws, it shall immediately inform the Data Fiduciary.</p>`,
  });

  // 3. Processor Obligations (Security)
  sections.push({
    title: '3. Data Security and Confidentiality',
    content: `
      <p>In accordance with the <strong>Information Technology (Reasonable Security Practices and Procedures) Rules, 2011</strong>, the Data Processor shall implement appropriate technical and organizational measures to protect Personal Data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.</p>
      <p>Such measures include, but are not limited to:</p>
      <ul>
        <li>Encryption of personal data in transit and at rest;</li>
        <li>Role-based access controls and strict authentication mechanisms;</li>
        <li>Ensuring that personnel authorized to process the data have committed themselves to strict confidentiality agreements.</li>
      </ul>`,
  });

  // 4. Sub-Processors
  sections.push({
    title: '4. Engagement of Sub-Processors',
    content: `
      <p>The Data Fiduciary provides general authorization for the Data Processor to engage third-party sub-processors (e.g., cloud hosting providers) to fulfill its service obligations.</p>
      <p>The Data Processor must ensure that any sub-processor is bound by written obligations that provide at least the same level of data protection as required under this DPA and the DPDP Act. The Data Processor remains fully liable to the Data Fiduciary for the performance of the sub-processor's obligations.</p>`,
  });

  // 5. Data Breach Notification (CERT-In)
  sections.push({
    title: '5. Personal Data Breach Notification',
    content: `
      <p>In the event of a Personal Data Breach, the Data Processor shall notify the Data Fiduciary without undue delay and in any event within <strong>6 hours</strong> of becoming aware of the breach, to allow the Data Fiduciary sufficient time to meet its own statutory reporting obligations to the Data Protection Board of India and <strong>CERT-In</strong>, whose Cyber Security Directions, 2022 mandate reporting within 6 hours of an entity noticing a covered incident.</p>
      <p>The Data Processor will provide reasonable assistance and sufficient information to the Data Fiduciary to investigate the breach, mitigate its effects, and notify affected Data Principals if required.</p>`,
  });

  // 6. Data Principal Rights
  sections.push({
    title: '6. Assistance with Data Principal Requests',
    content: `
      <p>Taking into account the nature of the processing, the Data Processor shall assist the Data Fiduciary by implementing appropriate technical and organizational measures to fulfill the Data Fiduciary's obligation to respond to requests for exercising Data Principal rights (such as the right to access, correction, erasure, and grievance redressal under the DPDP Act).</p>
      <p>If a Data Principal submits a request directly to the Data Processor, the Data Processor shall not respond directly but shall immediately forward the request to the Data Fiduciary.</p>`,
  });

  // 7. Data Deletion or Return
  sections.push({
    title: '7. Deletion or Return of Personal Data',
    content: `
      <p>Upon termination or expiration of the primary agreement, or upon written request from the Data Fiduciary, the Data Processor shall securely delete or return all Personal Data to the Data Fiduciary.</p>
      <p>The Data Processor shall delete existing copies of the Personal Data unless retention is mandated by applicable Indian law (e.g., financial or tax records). Upon request, the Data Processor shall provide written certification that the deletion has been performed.</p>`,
  });

  // 8. Governing Law
  sections.push({
    title: '8. Governing Law and Jurisdiction',
    content: `
      <p>This DPA shall be governed by and construed in accordance with the laws of India, specifically the Digital Personal Data Protection Act, 2023, and the Information Technology Act, 2000.</p>
      <p>Any disputes arising from this DPA shall be subject to the exclusive jurisdiction of the competent courts in <strong>${governingState}, India</strong>.</p>`,
  });

  sections.push({
    title: '9. Notification Contact',
    content: `
      <p>All notifications under this DPA, including Personal Data Breach notifications, shall be sent to the Data Processor's designated contact at:</p>
      <p><strong>${businessName}</strong><br><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>`,
  });

  // ─── 3. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 4. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Data Processing Agreement (DPA)',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This Data Processing Agreement establishes the statutory obligations of <strong>${businessName}</strong> when processing personal data on behalf of our clients.</p>`,
  });

  // ─── 5. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 6. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    ...meityLaws.filter(l => l.name.includes('Data Protection') || l.name.includes('Information Technology') || l.name.includes('CERT-In'))
  ];

  return {
    html,
    text,
    title: `Data Processing Agreement - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
            jurisdiction: 'IN',
    },
  };
}