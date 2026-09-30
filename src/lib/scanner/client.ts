/**
 * The single way the app talks to the scanner service.
 *
 * Fixes F-02 (key name mismatch meant the app was always rejected while the
 * service was open to everyone) by naming one env var on both sides, and
 * removes the copy-pasted fetch in scan/ and quick-scan/.
 *
 * Handles scanner cold starts (e.g. Render free tier sleeps after 15min idle,
 * takes 30-60s to wake up) with extended timeouts and retries.
 *
 * All timing fits within Vercel's 60s function timeout:
 * - First attempt: 35s (covers cold start wake)
 * - One retry: 15s + 3s backoff = 18s
 * - Total max: ~53s (fits within Vercel's 60s limit)
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

interface ScanOptions {
    timeoutMs?: number;
    requestId?: string;
    retries?: number;
}

/**
 * Timeouts tuned for Vercel's 60s function limit + Render free tier cold starts (30-60s wake):
 * - First attempt: 35s (covers cold start wake)
 * - One retry: 15s + 3s backoff = 18s
 * - Total max: ~53s (fits within Vercel's 60s limit with buffer)
 */
const FIRST_ATTEMPT_TIMEOUT_MS = 35_000;  // 35s for cold start
const RETRY_TIMEOUT_MS = 15_000;          // 15s for warm retry
const MAX_RETRIES = 1;                    // 2 attempts total (0, 1)
const RETRY_DELAY_BASE_MS = 3000;         // 3s base backoff

const SCAN_ENDPOINT = '/api/scan';

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is a retryable scanner error (5xx, timeout, network)
 */
function isRetryableError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.code === 'UPSTREAM_UNAVAILABLE';
    }
    // Network errors, timeouts are retryable
    return error instanceof TypeError || error instanceof DOMException;
}

/**
 * Execute scan with retry logic for cold starts.
 * Total time budget: ~53s max (fits in Vercel's 60s limit)
 */
export async function runScan(url: string, opts: ScanOptions = {}): Promise<ScannerResult> {
    const { scannerUrl, scannerApiKey } = config;

    if (!scannerUrl || !scannerApiKey) {
        throw new ApiError('UPSTREAM_UNAVAILABLE', 'Website scanning is temporarily unavailable.');
    }

    const maxRetries = opts.retries ?? MAX_RETRIES;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // First attempt gets extended timeout for cold start; retry gets shorter timeout
        const timeoutMs = attempt === 0 ? FIRST_ATTEMPT_TIMEOUT_MS : RETRY_TIMEOUT_MS;
        
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(new URL(SCAN_ENDPOINT, scannerUrl), {
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

            clearTimeout(timer);

            if (!response.ok || !payload?.success || !payload.data) {
                // 4xx from the scanner is usually the URL guard refusing a target:
                // surface its message, which is written to be user-safe.
                if (response.status >= 400 && response.status < 500 && payload?.error?.message) {
                    throw new ApiError('BAD_REQUEST', payload.error.message, { scannerCode: payload.error.code });
                }
                // 5xx or empty response - retryable (scanner may be waking up)
                throw new ApiError('UPSTREAM_UNAVAILABLE', 'Scanner service unavailable, retrying...');
            }

            return payload.data;
        } catch (error) {
            clearTimeout(timer);
            lastError = error;

            // Don't retry on client errors (4xx) or if max retries reached
            if (error instanceof ApiError && error.code === 'BAD_REQUEST') {
                throw error;
            }
            if (attempt === maxRetries) {
                break;
            }
            if (!isRetryableError(error)) {
                break;
            }

            // Backoff with jitter: 3s
            const delay = RETRY_DELAY_BASE_MS + Math.random() * 1000;
            console.warn(`[scanner] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms:`, error instanceof Error ? error.message : String(error));
            await sleep(delay);
        }
    }

    // All retries exhausted
    if (lastError instanceof ApiError) throw lastError;
    if (lastError instanceof Error && lastError.name === 'AbortError') {
        throw new ApiError('UPSTREAM_UNAVAILABLE', 'Scanner service took too long to respond (cold start). Please try again in a moment.');
    }
    throw new ApiError('UPSTREAM_UNAVAILABLE', 'Website scanning is temporarily unavailable after retries. The scanner may be waking up — please try again in a moment.');
}