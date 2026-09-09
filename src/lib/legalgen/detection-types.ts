// =============================================================================
// LEGALGEN - WEBSITE DETECTION TYPES (Upgraded Scraper Output)
// =============================================================================
// Replaces plain text output with structured intelligence
// =============================================================================

// ─── 1. SCAN RESULT (Main Output) ────────────────────────────────────────

export interface WebsiteScanResult {
    scanId: string;
    scannedAt: string;
    url: string;

    // Structured Results (NEW!)
    business: DetectedBusiness;
    technologies: DetectedTechnologies;
    cookies: CookieDetection[];
    forms: FormDetection[];
    legalPages: LegalPageResult[];

    // Quality Metrics
    confidence: number;
    pagesScanned: number;

    // Legacy Support (keep working!)
    textContent?: string;
    scannedUrls?: string[];
}

// ─── 2. BUSINESS INTELLIGENCE ────────────────────────────────────────────

export interface DetectedBusiness {
    businessModel: string;
    industry: string;
    sellsProducts: boolean;
    sellsServices: boolean;
    acceptsPayments: boolean;
    hasSubscriptions: boolean;
    hasUserAccounts: boolean;
    targetsChildren: boolean;
    international: boolean;

    signals: DetectionSignal[];
}

export interface DetectionSignal {
    signal: string;
    found: boolean;
    confidence: number;
    evidence: string;
}

// ─── 3. TECHNOLOGY DETECTION ─────────────────────────────────────────────

export interface DetectedTechnologies {
    analytics: TechnologyItem[];
    payments: PaymentItem[];
    advertising: TechnologyItem[];
    hosting: TechnologyItem[];
    ai: TechnologyItem[];
    crm: TechnologyItem[];
    security: TechnologyItem[];
}

export interface TechnologyItem {
    name: string;
    vendor: string;
    category: string;
    detected: boolean;
    confidence: number;
    detectionMethod: 'script' | 'dns' | 'header' | 'meta' | 'cookie' | 'text' | 'pattern';
}

export interface PaymentItem extends TechnologyItem {
    supportsRecurring: boolean;
    supportsInternational: boolean;
    paymentMethods: string[];
}

// ─── 4. COOKIE DETECTION ─────────────────────────────────────────────────

export interface CookieDetection {
    name: string;
    domain: string;
    category: 'necessary' | 'analytics' | 'advertising' | 'functional' | 'unknown';
    duration: string;
    isFirstParty: boolean;
    provider?: string;
}

// ─── 5. FORM DETECTION ───────────────────────────────────────────────────

export interface FormDetection {
    type: 'contact' | 'newsletter' | 'registration' | 'login' | 'checkout' | 'payment';
    purpose: string;
    fields: string[];
    collectsPersonalData: boolean;
    hasConsentCheckbox: boolean;
    isSecure: boolean;             // HTTPS action URL
    url: string;
}

// ─── 6. LEGAL PAGE DETECTION ─────────────────────────────────────────────

export interface LegalPageResult {
    pageType: LegalPageType;
    url: string;
    exists: boolean;
    httpStatus?: number;
    wordCount?: number;
    hasRequiredSections?: boolean;
    issues?: string[];
}

export type LegalPageType =
    | 'privacy-policy' | 'terms-of-service' | 'terms-and-conditions'
    | 'cookie-policy' | 'refund-policy' | 'return-policy'
    | 'cancellation-policy' | 'shipping-policy' | 'acceptable-use-policy'
    | 'disclaimer' | 'sla' | 'grievance-redressal' | 'other';

// ─── 7. CONVERSION HELPER ────────────────────────────────────────────────

/**
 * Converts old scraper output to new structured format
 */
export function convertScraperOutput(oldOutput: {
    text: string;
    scannedUrls: string[];
}, url: string): WebsiteScanResult {
    return {
        scanId: `scan-${Date.now()}`,
        scannedAt: new Date().toISOString(),
        url,

        // Basic detection (would be enhanced by actual scanner)
        business: {
            businessModel: 'unknown',
            industry: 'unknown',
            sellsProducts: oldOutput.text.toLowerCase().includes('product') || oldOutput.text.toLowerCase().includes('price'),
            sellsServices: oldOutput.text.toLowerCase().includes('service'),
            acceptsPayments: oldOutput.text.toLowerCase().includes('payment') || oldOutput.text.toLowerCase().includes('razorpay'),
            hasSubscriptions: oldOutput.text.toLowerCase().includes('subscription') || oldOutput.text.toLowerCase().includes('monthly'),
            hasUserAccounts: oldOutput.text.toLowerCase().includes('login') || oldOutput.text.toLowerCase().includes('sign up'),
            targetsChildren: false,
            international: oldOutput.text.toLowerCase().includes('international') || oldOutput.text.toLowerCase().includes('worldwide'),
            signals: [],
        },

        technologies: {
            analytics: detectTechnologies(oldOutput.text, ['google analytics', 'ga4', 'gtag', 'analytics']),
            payments: detectPaymentMethods(oldOutput.text),
            advertising: detectTechnologies(oldOutput.text, ['facebook pixel', 'meta pixel', 'google ads', 'gtm']),
            hosting: [],
            ai: [],
            crm: [],
            security: [],
        },

        cookies: [], // Would need actual cookie scanning
        forms: detectForms(oldOutput.text),
        legalPages: detectLegalPages(oldOutput.scannedUrls),

        confidence: 60, // Low confidence without full scanner
        pagesScanned: oldOutput.scannedUrls.length,

        // Legacy support
        textContent: oldOutput.text,
        scannedUrls: oldOutput.scannedUrls,
    };
}

function detectTechnologies(text: string, patterns: string[]): TechnologyItem[] {
    const lowerText = text.toLowerCase();
    return patterns
        .filter(p => lowerText.includes(p.toLowerCase()))
        .map(p => ({
            name: p,
            vendor: p.split(' ')[0],
            category: 'detected',
            detected: true,
            confidence: 0.7,
            detectionMethod: 'text' as const,
        }));
}

function detectPaymentMethods(text: string): PaymentItem[] {
    const lowerText = text.toLowerCase();
    const methods: PaymentItem[] = [];

    if (lowerText.includes('razorpay')) {
        methods.push({
            name: 'Razorpay',
            vendor: 'Razorpay',
            category: 'payment',
            detected: true,
            confidence: 0.9,
            detectionMethod: 'text',
            supportsRecurring: true,
            supportsInternational: false,
            paymentMethods: ['UPI', 'Cards', 'Netbanking'],
        });
    }

    if (lowerText.includes('stripe')) {
        methods.push({
            name: 'Stripe',
            vendor: 'Stripe',
            category: 'payment',
            detected: true,
            confidence: 0.9,
            detectionMethod: 'text',
            supportsRecurring: true,
            supportsInternational: true,
            paymentMethods: ['Cards'],
        });
    }

    return methods;
}

function detectForms(text: string): FormDetection[] {
    const forms: FormDetection[] = [];

    if (text.toLowerCase().includes('contact') || text.toLowerCase().includes('email')) {
        forms.push({
            type: 'contact',
            purpose: 'Contact form',
            fields: ['email', 'name', 'message'],
            collectsPersonalData: true,
            hasConsentCheckbox: text.toLowerCase().includes('consent'),
            isSecure: true,
            url: '/contact',
        });
    }

    return forms;
}

function detectLegalPages(urls: string[]): LegalPageResult[] {
    const pageTypes: { pattern: string; type: LegalPageType }[] = [
        { pattern: 'privacy', type: 'privacy-policy' },
        { pattern: 'terms', type: 'terms-of-service' },
        { pattern: 'cookie', type: 'cookie-policy' },
        { pattern: 'refund', type: 'refund-policy' },
        { pattern: 'return', type: 'return-policy' },
        { pattern: 'cancellation', type: 'cancellation-policy' },
    ];

    return pageTypes.map(({ pattern, type }) => ({
        pageType: type,
        url: urls.find(u => u.toLowerCase().includes(pattern)) || '',
        exists: urls.some(u => u.toLowerCase().includes(pattern)),
    }));
}