/**
 * Shared business type detection logic.
 * Single source of truth for business classification rules.
 */

export interface BusinessTypeConfig {
  name: string;
  indicators: Array<{ pattern: RegExp; weight: number }>;
  required: string[];
}

export const BUSINESS_TYPE_RULES: Record<string, BusinessTypeConfig> = {
  ecommerce: {
    name: 'E-Commerce',
    indicators: [
      { pattern: /add.to.cart|checkout|buy.now/gi, weight: 10 },
      { pattern: /shipping|refund|delivery/gi, weight: 9 },
      { pattern: /product|price|offer/gi, weight: 8 },
    ],
    required: ['Privacy Policy', 'Refund Policy', 'Terms of Service', 'Shipping Policy'],
  },
  saas: {
    name: 'SaaS/Tech',
    indicators: [
      { pattern: /sign.up|free.trial|pricing/gi, weight: 9 },
      { pattern: /api|dashboard|login/gi, weight: 8 },
    ],
    required: ['Privacy Policy', 'Terms of Service', 'SLA', 'Acceptable Use'],
  },
  finance: {
    name: 'Finance',
    indicators: [
      { pattern: /loan|invest|stock|banking/gi, weight: 10 },
      { pattern: /rbi|sebi|kyc/gi, weight: 9 },
    ],
    required: ['Privacy Policy', 'Risk Disclosure', 'Grievance Redressal', 'KYC Policy'],
  },
  healthcare: {
    name: 'Healthcare',
    indicators: [
      { pattern: /doctor|medicine|consultation/gi, weight: 9 },
      { pattern: /patient|medical|hospital/gi, weight: 8 },
    ],
    required: ['Privacy Policy', 'Medical Disclaimer', 'Patient Consent'],
  },
  default: {
    name: 'General Business',
    indicators: [],
    required: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
  },
};

export function detectBusinessType(htmlContent: string, _url: string): BusinessTypeConfig {
  const lowerText = htmlContent.toLowerCase();

  let bestScore = 0;
  let bestType = 'default';

  for (const [key, config] of Object.entries(BUSINESS_TYPE_RULES)) {
    if (key === 'default') continue;
    let score = 0;
    for (const ind of config.indicators) {
      const matches = lowerText.match(ind.pattern);
      if (matches) score += matches.length * ind.weight;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = key;
    }
  }
  return BUSINESS_TYPE_RULES[bestType] || BUSINESS_TYPE_RULES.default;
}

export function calculateComplianceScore(
  businessConfig: BusinessTypeConfig,
  foundPages: Array<{ name: string; url: string }>
): { score: number; missingPages: string[]; complianceResults: ComplianceResult[] } {
  const missingPages = businessConfig.required.filter((reqPage) =>
    !foundPages.some(p => p.name.toLowerCase() === reqPage.toLowerCase())
  );

  const score = Math.max(0, 100 - (missingPages.length * 25));

  const complianceResults: ComplianceResult[] = businessConfig.required.map((pageName) => {
    const found = foundPages.some(p => p.name.toLowerCase() === pageName.toLowerCase());
    return {
      type: pageName.toLowerCase().replace(/\s+/g, '-'),
      label: pageName,
      page: pageName,
      found,
      url: found ? foundPages.find(p => p.name === pageName)?.url || null : null,
      source: found ? 'Detected' : '',
      severity: ['Privacy Policy', 'Terms of Service'].includes(pageName) ? 'critical' : 'important',
      description: `Required for ${businessConfig.name}`,
      generateType: pageName.toLowerCase().replace(/\s+/g, '-'),
    };
  });

  return { score, missingPages, complianceResults };
}

export interface ComplianceResult {
  type: string;
  label: string;
  page: string;
  found: boolean;
  url: string | null;
  source: string;
  severity: 'critical' | 'important';
  description: string;
  generateType: string;
}

export function inferPageNameFromUrl(url: string): string {
  const pathName = new URL(url).pathname.toLowerCase();
  if (pathName.includes('privacy')) return 'Privacy Policy';
  if (pathName.includes('term')) return 'Terms of Service';
  if (pathName.includes('refund')) return 'Refund Policy';
  if (pathName.includes('cookie')) return 'Cookie Policy';
  if (pathName.includes('shipping')) return 'Shipping Policy';
  if (pathName.includes('cancellation')) return 'Cancellation Policy';
  if (pathName.includes('return')) return 'Return Policy';
  if (pathName.includes('disclaimer')) return 'Disclaimer';
  if (pathName.includes('aup') || pathName.includes('acceptable-use')) return 'Acceptable Use Policy';
  if (pathName.includes('sla') || pathName.includes('service-level')) return 'SLA';
  if (pathName.includes('dmca')) return 'DMCA Policy';
  if (pathName.includes('community')) return 'Community Guidelines';
  if (pathName.includes('content-moderation')) return 'Content Moderation Policy';
  if (pathName.includes('data-processing')) return 'Data Processing Agreement';
  if (pathName.includes('gdpr')) return 'GDPR Compliance';
  if (pathName.includes('eula')) return 'EULA';
  return 'Legal Page';
}