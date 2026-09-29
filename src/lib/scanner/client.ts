/**
 * The single way the app talks to the scanner service.
 *
 * Fixes F-02 (key name mismatch meant the app was always rejected while the
 * service was open to everyone) by naming one env var on both sides, and
 * removes the copy-pasted fetch in scan/ and quick-scan/.
 *
 * Handles scanner cold starts (e.g. Render free tier sleeps after 15min idle,
 * takes 30-60s to wake up) with warmup ping, extended timeouts, and retries.
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
    skipWarmup?: boolean;
}

/**
 * Timeouts tuned for Render free tier cold starts (30-60s wake time):
 * - First attempt: 35s (allows cold start to complete)
 * - Subsequent attempts: 18s each
 * - Max 4 attempts total = ~35 + 18 + 18 + 18 = ~89s worst case
 * - Backoff delays: 3s, 6s, 12s
 */
const FIRST_ATTEMPT_TIMEOUT_MS = 35_000;  // 35s for cold start
const SUBSEQUENT_TIMEOUT_MS = 18_000;     // 18s for warm retries
const MAX_RETRIES = 3;                    // 4 attempts total (0,1,2,3)
const RETRY_DELAY_BASE_MS = 3000;         // 3s base backoff

const HEALTH_ENDPOINT = '/health';
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
 * Ping the scanner's health endpoint to wake it up before scanning.
 * Returns true if scanner appears awake, false if still sleeping/unreachable.
 */
async function warmupScanner(scannerUrl: string, apiKey: string, requestId?: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000); // 10s timeout for health check

        const response = await fetch(new URL(HEALTH_ENDPOINT, scannerUrl), {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'X-API-Key': apiKey,
                ...(requestId ? { 'X-Request-Id': requestId } : {}),
            },
        });

        clearTimeout(timer);

        if (response.ok) {
            const payload = await response.json().catch(() => null);
            return payload?.ok === true;
        }
    } catch {
        // Health check failed - scanner likely sleeping
    }
    return false;
}

/**
 * Execute scan with warmup ping and retry logic for cold starts
 */
export async function runScan(url: string, opts: ScanOptions = {}): Promise<ScannerResult> {
    const { scannerUrl, scannerApiKey } = config;

    if (!scannerUrl || !scannerApiKey) {
        throw new ApiError('UPSTREAM_UNAVAILABLE', 'Website scanning is temporarily unavailable.');
    }

    const maxRetries = opts.retries ?? MAX_RETRIES;
    const skipWarmup = opts.skipWarmup ?? false;

    let lastError: unknown;

    // Step 1: Warmup ping (skip if explicitly disabled or for retries)
    if (!skipWarmup) {
        console.log('[scanner] Warming up scanner...');
        const isAwake = await warmupScanner(scannerUrl, scannerApiKey, opts.requestId);
        if (isAwake) {
            console.log('[scanner] Scanner is awake');
        } else {
            console.log('[scanner] Scanner appears cold, will retry with extended timeout');
        }
        // Small delay after warmup to let scanner fully wake
        await sleep(500);
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        // First attempt gets extended timeout for cold start
        const timeoutMs = attempt === 0 ? FIRST_ATTEMPT_TIMEOUT_MS : SUBSEQUENT_TIMEOUT_MS;
        
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

            // Exponential backoff with jitter: 3s, 6s, 12s
            const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt) + Math.random() * 1000;
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