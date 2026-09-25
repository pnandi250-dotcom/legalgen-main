/**
 * The single way the app talks to the scanner service.
 *
 * Fixes F-02 (key name mismatch meant the app was always rejected while the
 * service was open to everyone) by naming one env var on both sides, and
 * removes the copy-pasted fetch in scan/ and quick-scan/.
 */
import { config } from '@/lib/config';
import { ApiError } from '@/lib/api/errors';

export interface ScannerFinding {
    kind: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    detail: string;
    regulation: { name: string; section: string | null; citationUrl: string | null } | null;
    evidence: { url: string | null; httpStatus: number | null; matchedText: string | null };
    confidence: 'high' | 'medium' | 'low';
    suggestedDocumentType: string | null;
}

export interface ScannerResult {
    scannerVersion: string;
    url: string;
    finalUrl: string;
    domain: string;
    scannedAt: string;
    title: string | null;
    businessType: { key: string; name: string; confidence: number };
    technologies: Array<{ name: string; category: string }>;
    forms: Array<{ index: number; fieldTypes: string[]; collectsPersonalData: boolean }>;
    policies: Array<{
        expected: string;
        found: boolean;
        url: string | null;
        httpStatus: number | null;
        substantive: boolean;
        confidence: 'high' | 'medium' | 'low';
    }>;
    findings: ScannerFinding[];
    score: { value: number; grade: string; confidence: 'high' | 'medium' | 'low' };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    checksPerformed: string[];
    checksSkipped: Array<{ check: string; reason: string }>;
}

export async function runScan(url: string, opts: { timeoutMs?: number; requestId?: string } = {}): Promise<ScannerResult> {
    const { scannerUrl, scannerApiKey } = config;

    if (!scannerUrl || !scannerApiKey) {
        throw new ApiError('UPSTREAM_UNAVAILABLE', 'Website scanning is temporarily unavailable.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25_000);

    try {
        const response = await fetch(new URL('/api/scan', scannerUrl), {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': scannerApiKey,
                ...(opts.requestId ? { 'X-Request-Id': opts.requestId } : {}),
            },
            body: JSON.stringify({ url }),
        });

        const payload = (await response.json().catch(() => null)) as
            | { success: boolean; data?: ScannerResult; error?: { code?: string; message?: string } }
            | null;

        if (!response.ok || !payload?.success || !payload.data) {
            // 4xx from the scanner is usually the URL guard refusing a target:
            // surface its message, which is written to be user-safe.
            if (response.status >= 400 && response.status < 500 && payload?.error?.message) {
                throw new ApiError('BAD_REQUEST', payload.error.message, { scannerCode: payload.error.code });
            }
            throw new ApiError('UPSTREAM_UNAVAILABLE', 'We could not reach that site right now. Try again shortly.');
        }

        return payload.data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (controller.signal.aborted) {
            throw new ApiError('UPSTREAM_UNAVAILABLE', 'That site took too long to respond.');
        }
        throw new ApiError('UPSTREAM_UNAVAILABLE', 'Website scanning is temporarily unavailable.');
    } finally {
        clearTimeout(timer);
    }
}