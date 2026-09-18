/**
 * Request schemas. Fixes part of F-12: bodies were destructured and cast
 * straight into the engines (`body.businessProfile as BusinessProfile`).
 */
import { z } from 'zod';

/** Accepts "example.com" or a full URL; normalises to https when bare. */
export const urlInput = z
    .string()
    .trim()
    .min(3, 'Enter a website address.')
    .max(2000)
    .transform((value) => (/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`))
    .refine((value) => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }, 'Enter a valid http or https address.');

export const scanRequest = z.object({
    url: urlInput,
    /** Persist the result and return a scan id. */
    save: z.boolean().default(true),
});
export type ScanRequest = z.infer<typeof scanRequest>;

export const quickScanRequest = z.object({
    url: urlInput,
    companyName: z.string().trim().max(200).optional(),
});
export type QuickScanRequest = z.infer<typeof quickScanRequest>;

export const huntRequest = z.object({ url: urlInput });

const featureFlags = z.record(z.string().max(60), z.boolean()).default({});

export const analyzeRequest = z
    .object({
        url: urlInput.optional(),
        companyInfo: z
            .object({
                name: z.string().trim().min(1, 'Company name is required.').max(200),
                website: urlInput.optional(),
                industry: z.string().trim().max(80).default('general'),
                employeeCount: z.number().int().min(0).max(5_000_000).optional(),
                jurisdictions: z.array(z.enum(['IN', 'EU', 'UK', 'US', 'US-CA'])).min(1).default(['IN']),
            })
            .optional(),
        features: featureFlags.optional(),
    })
    .refine((body) => Boolean(body.companyInfo || body.features), {
        message: 'Provide company details or feature answers.',
    });
export type AnalyzeRequest = z.infer<typeof analyzeRequest>;

export const documentType = z.enum([
    'privacy-policy',
    'terms-of-service',
    'refund-policy',
    'return-policy',
    'shipping-policy',
    'cancellation-policy',
    'cookie-policy',
    'disclaimer',
    'eula',
    'aup',
    'dmca-policy',
    'community-guidelines',
    'content-moderation-policy',
    'data-processing-agreement',
    'gdpr-compliance',
    'service-level-agreement',
]);

export const jurisdiction = z.enum(['IN', 'EU', 'UK', 'US', 'US-CA', 'GLOBAL']);

export const saveDocumentRequest = z.object({
    documentType,
    jurisdiction,
    title: z.string().trim().min(1).max(200),
    /** The answers behind the document, so it can be regenerated later. */
    answers: z.record(z.string().max(80), z.union([z.string().max(5000), z.boolean(), z.number(), z.array(z.string().max(200))])),
    /** Existing document to add a version to; omit to create a new one. */
    documentId: z.string().trim().min(6).max(64).optional(),
    publish: z.boolean().default(false),
});
export type SaveDocumentRequest = z.infer<typeof saveDocumentRequest>;

export const verifyStartRequest = z.object({
    domain: z
        .string()
        .trim()
        .toLowerCase()
        .min(3)
        .max(253)
        .transform((d) => d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
        .refine((d) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d), 'Enter a domain like example.com.'),
    method: z.enum(['file', 'dns', 'meta']),
});

export const verifyCheckRequest = z.object({
    verificationId: z.string().trim().min(6).max(64),
});

export const sessionRequest = z.object({
    idToken: z.string().min(20).max(4096),
});
