// src/lib/legalgen/service-level-agreement.ts
import { LAW_REGISTRY, type FormData, type GeneratedDocument } from './types';
import { renderDocument, type RenderSection } from './shared/render';
import { escapeHtml, safeUrl, safeEmail } from './shared/security';

function today(): string {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function generateServiceLevelAgreement(data: FormData): GeneratedDocument {
  // ─── 1. SAFELY EXTRACT ALL USER INPUTS ──────────────────────────────
  const businessName = escapeHtml((data.businessName as string) || '[Your Business Name]');
  const websiteUrl = safeUrl((data.websiteUrl as string) || '#');
  const email = safeEmail((data.email as string) || '[Your Email]');
  const effectiveDate = escapeHtml((data.effectiveDate as string) || today());
  const version = escapeHtml((data.version as string) || '1.0');

  // Specific SLA Variables (You can add these to your form later, defaulting to standard SaaS metrics)
  const uptimeTarget = escapeHtml((data.uptimeTarget as string) || '99.9%');
  const responseTime = escapeHtml((data.responseTime as string) || '24 hours');
  const governingState = escapeHtml((data.governingState as string) || 'Delhi');

  // ─── 2. BUILD RENDER SECTIONS ─────────────────────────────────────────
  const sections: RenderSection[] = [];

  // 1. Introduction
  sections.push({
    title: '1. Introduction and Scope',
    content: `
      <p>This Service Level Agreement ("SLA") outlines the service availability, performance guarantees, and support response commitments provided by <strong>${businessName}</strong> ("Provider", "we", or "us") to the customer ("Customer", "you") regarding the use of our hosted software, APIs, and cloud services (collectively, the "Services").</p>
      <p>This SLA forms an integral part of the Master Service Agreement or Terms of Service executed between the Provider and the Customer, governed under the <strong>Indian Contract Act, 1872</strong>.</p>`,
  });

  // 2. Service Availability (Uptime)
  sections.push({
    title: '2. Service Availability & Uptime Target',
    content: `
      <p>We are committed to providing a highly reliable service. We guarantee a Monthly Uptime Percentage of at least <strong>${uptimeTarget}</strong> for our core Services.</p>
      <p><strong>Calculation:</strong> "Monthly Uptime Percentage" is calculated by subtracting from 100% the percentage of minutes during the month in which the Services were completely unavailable (Downtime), excluding Excused Downtime.</p>`,
  });

  // 3. Excused Downtime (Crucial for SaaS protection)
  sections.push({
    title: '3. Maintenance & Excused Downtime',
    content: `
      <p>Under this SLA, "Excused Downtime" shall not be counted towards the Monthly Uptime calculation and includes unavailability resulting from:</p>
      <ul>
        <li><strong>Scheduled Maintenance:</strong> Routine maintenance windows of which the Customer is notified at least 48 hours in advance.</li>
        <li><strong>Emergency Maintenance:</strong> Critical security patching or emergency infrastructure repairs required to protect data integrity (including compliance with <strong>CERT-In Directions, 2022</strong>).</li>
        <li><strong>Force Majeure:</strong> Events beyond our reasonable control, including natural disasters, acts of war, terrorism, civil riots, prolonged telecommunications network failures, or widespread internet outages.</li>
        <li><strong>Customer Actions:</strong> Downtime caused by the Customer's misuse of the Services, custom scripts, third-party integrations, or failure to follow security protocols.</li>
      </ul>`,
  });

  // 4. Support Response Times
  sections.push({
    title: '4. Technical Support and Response Times',
    content: `
      <p>In the event of a Service disruption, the Customer must submit a support ticket via <a href="mailto:${email}">${email}</a>. We categorize and respond to support requests based on the following severity levels:</p>
      <ul>
        <li><strong>Severity 1 (Critical):</strong> Complete Service outage or severe degradation preventing core operations. <br/><em>Target Response Time: Within ${responseTime}.</em></li>
        <li><strong>Severity 2 (High):</strong> Major feature malfunction impacting productivity, but a workaround exists. <br/><em>Target Response Time: Within 12 hours, or ${responseTime} if longer.</em></li>
        <li><strong>Severity 3 (Normal):</strong> Minor bugs, general inquiries, or configuration questions. <br/><em>Target Response Time: Within 48 hours.</em></li>
      </ul>
      <p><em>Note: Target Response Times are applicable during standard Indian Business Hours (Monday to Friday, 9:00 AM - 6:00 PM IST), excluding public holidays.</em></p>`,
  });

  // 5. Service Credits (Liquidated Damages under Indian Law)
  const uptimeNumeric = parseFloat(uptimeTarget);
  const midTier = Math.max(uptimeNumeric - 0.9, 95.0).toFixed(2);

  sections.push({
    title: '5. Service Credits and Remedies',
    content: `
      <p>If we fail to meet the ${uptimeTarget} Monthly Uptime Guarantee, the Customer shall be eligible to request a Service Credit. Under Section 74 of the <strong>Indian Contract Act, 1872</strong>, these credits constitute a reasonable pre-estimate of compensation and shall be the Customer's sole and exclusive remedy for any performance failure.</p>
      <ul>
        <li><strong>Uptime between ${midTier}% and ${uptimeTarget} (exclusive):</strong> 10% credit of the monthly subscription fee.</li>
        <li><strong>Uptime below ${midTier}%:</strong> 20% credit of the monthly subscription fee.</li>
      </ul>
      <p><strong>Claim Procedure:</strong> To receive a Service Credit, the Customer must submit a written claim to <a href="mailto:${email}">${email}</a> within 30 days of the incident. The claim must include dates, times, and logs documenting the Downtime. Approved Service Credits will be applied to the Customer's next billing cycle.</p>`,
  });

  // 6. Data Backup & Security
  sections.push({
    title: '6. Data Backup and Incident Management',
    content: `
      <p>While we employ automated backup mechanisms and enterprise-grade security protocols in compliance with the <strong>Information Technology (Reasonable Security Practices and Procedures) Rules, 2011</strong>, the Customer remains responsible for independently maintaining backups of their critical data.</p>
      <p>In the event of a cyber security incident, we will notify the Customer and the Indian Computer Emergency Response Team (CERT-In) in accordance with statutory reporting timelines.</p>`,
  });

  // 7. Governing Law
  sections.push({
    title: '7. Governing Law and Dispute Resolution',
    content: `
      <p>This SLA shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to this SLA shall be subject to the exclusive jurisdiction of the competent courts in <strong>${governingState}, India</strong>.</p>`,
  });

  // ─── 3. FILTER ACTIVE SECTIONS ─────────────────────────────────────────
  const activeSections = sections.filter((s) => s.content.trim().length > 0);

  // ─── 4. RENDER DOCUMENT HTML ───────────────────────────────────────────
  const html = renderDocument({
    documentTitle: 'Service Level Agreement (SLA)',
    businessName: businessName,
    effectiveDate: effectiveDate,
    version: version,
    sections: activeSections,
    preambleHtml: `<p><strong>Effective Date:</strong> ${effectiveDate} | <strong>Document Version:</strong> ${version}</p><p>This Service Level Agreement defines the operational commitments, uptime guarantees, and support frameworks provided by <strong>${businessName}</strong>.</p>`,
  });

  // ─── 5. GENERATE PLAIN TEXT VERSION ──────────────────────────────────
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ─── 6. ATTACH LAW REGISTRY & RETURN ──────────────────────────────────
  const lawJusticeLaws = LAW_REGISTRY['Law & Justice'] || [];
  const meityLaws = LAW_REGISTRY['MeitY'] || [];

  const relevantLaws = [
    ...lawJusticeLaws.filter(l => l.name.includes('Contract')),
    ...meityLaws.filter(l => l.name.includes('Information Technology Act') || l.name.includes('CERT-In'))
  ];

  return {
    html,
    text,
    title: `Service Level Agreement - ${businessName}`,
    complianceInfo: {
      laws: relevantLaws,
      lastUpdated: new Date().toISOString(),
      jurisdiction: 'IN',
    },
  };
}