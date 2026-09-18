/**
 * SSRF guard + safe outbound fetch.
 *
 * Fixes audit findings F-04 (SSRF in every URL-accepting endpoint) and
 * F-15 (no timeout, no response size cap).
 *
 * Every outbound fetch to a user-supplied URL MUST go through safeFetch().
 */
import { lookup } from 'node:dns/promises';
import net from 'node:net';

export type UrlGuardCode =
    | 'INVALID_URL'
    | 'BLOCKED_SCHEME'
    | 'BLOCKED_HOST'
    | 'BLOCKED_ADDRESS'
    | 'BLOCKED_PORT'
    | 'TOO_MANY_REDIRECTS'
    | 'RESPONSE_TOO_LARGE'
    | 'UNSUPPORTED_CONTENT_TYPE'
    | 'TIMEOUT'
    | 'UPSTREAM_ERROR';

export class UrlGuardError extends Error {
    constructor(message: string, readonly code: UrlGuardCode) {
        super(message);
        this.name = 'UrlGuardError';
    }
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/** Ports that are never useful for scanning a public website. */
const BLOCKED_PORTS = new Set([
    22, 23, 25, 53, 110, 143, 465, 587, 993, 995,
    1433, 1521, 3306, 5432, 6379, 9200, 11211, 27017,
    2375, 2376, 10250,
]);

const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal', 'metadata.goog', 'instance-data'];

export interface SafeFetchOptions {
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
    allowedContentTypes?: string[];
    method?: 'GET' | 'HEAD';
    headers?: Record<string, string>;
    signal?: AbortSignal;
}

const DEFAULTS = {
    timeoutMs: 12_000,
    maxBytes: 2 * 1024 * 1024,
    maxRedirects: 3,
    allowedContentTypes: ['text/html', 'application/xhtml+xml', 'text/plain', 'application/xml', 'text/xml'],
    method: 'GET' as const,
};

export const USER_AGENT =
    process.env.SCANNER_USER_AGENT ?? 'LegalGenBot/1.0 (+https://legalgen.in/bot; compliance scanner)';

/**
 * True for any address a public website can never legitimately live on:
 * loopback, link-local (incl. cloud metadata), RFC1918, CGNAT, benchmarking,
 * documentation, multicast, reserved, and the IPv6 equivalents.
 */
export function isBlockedAddress(ip: string): boolean {
    const version = net.isIP(ip);
    if (version === 4) return isBlockedIPv4(ip);
    if (version === 6) return isBlockedIPv6(ip);
    return true;
}

function isBlockedIPv4(ip: string): boolean {
    const p = ip.split('.').map(Number);
    if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
    const [a, b] = p;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51) return true;
    if (a === 203 && b === 0) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
}

function isBlockedIPv6(ip: string): boolean {
    const addr = ip.toLowerCase().split('%')[0];
    if (addr === '::' || addr === '::1') return true;
    const mapped = addr.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIPv4(mapped[1]);
    if (/^fe[89ab]/.test(addr)) return true;
    if (/^f[cd]/.test(addr)) return true;
    if (addr.startsWith('ff')) return true;
    if (addr.startsWith('2001:db8')) return true;
    if (addr.startsWith('64:ff9b')) return true;
    return false;
}

/** Parse loosely-typed user input ("example.com") into a URL. */
export function parseUserUrl(input: unknown): URL {
    if (typeof input !== 'string' || input.trim() === '') {
        throw new UrlGuardError('A URL is required', 'INVALID_URL');
    }
    const raw = input.trim();
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    let url: URL;
    try {
        url = new URL(candidate);
    } catch {
        throw new UrlGuardError('That does not look like a valid URL', 'INVALID_URL');
    }
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
        throw new UrlGuardError('Only http and https URLs can be scanned', 'BLOCKED_SCHEME');
    }
    return url;
}

/** Resolve the hostname and refuse anything pointing into private space. */
export async function assertPublicUrl(url: URL): Promise<{ address: string; family: number }> {
    const host = url.hostname.toLowerCase().replace(/\.$/, '');

    if (BLOCKED_HOSTNAMES.includes(host) || host.endsWith('.localhost') || host.endsWith('.internal')) {
        throw new UrlGuardError('That host cannot be scanned', 'BLOCKED_HOST');
    }
    if (url.port && BLOCKED_PORTS.has(Number(url.port))) {
        throw new UrlGuardError('That port cannot be scanned', 'BLOCKED_PORT');
    }

    const literal = host.replace(/^\[|\]$/g, '');
    if (net.isIP(literal)) {
        if (isBlockedAddress(literal)) {
            throw new UrlGuardError('That address cannot be scanned', 'BLOCKED_ADDRESS');
        }
        return { address: literal, family: net.isIP(literal) };
    }

    let records: Array<{ address: string; family: number }>;
    try {
        records = await lookup(host, { all: true, verbatim: true });
    } catch {
        throw new UrlGuardError('That hostname could not be resolved', 'BLOCKED_HOST');
    }
    if (records.length === 0) {
        throw new UrlGuardError('That hostname could not be resolved', 'BLOCKED_HOST');
    }
    // Every answer must be public: one private A record is enough to rebind.
    for (const record of records) {
        if (isBlockedAddress(record.address)) {
            throw new UrlGuardError('That address cannot be scanned', 'BLOCKED_ADDRESS');
        }
    }
    return records[0];
}

export interface SafeFetchResult {
    url: string;
    finalUrl: string;
    status: number;
    contentType: string | null;
    body: string;
    bytes: number;
    truncated: boolean;
    elapsedMs: number;
    redirects: string[];
}

export async function safeFetch(input: string | URL, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
    const opts = { ...DEFAULTS, ...options };
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
    if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const redirects: string[] = [];
    let current = input instanceof URL ? input : parseUserUrl(input);
    const originalUrl = current.toString();

    try {
        for (let hop = 0; hop <= opts.maxRedirects; hop++) {
            await assertPublicUrl(current);

            let response: Response;
            try {
                response = await fetch(current, {
                    method: opts.method,
                    redirect: 'manual',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': USER_AGENT,
                        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1',
                        'Accept-Language': 'en',
                        ...(options.headers ?? {}),
                    },
                });
            } catch (error) {
                if (controller.signal.aborted) {
                    throw new UrlGuardError(`Request timed out after ${opts.timeoutMs}ms`, 'TIMEOUT');
                }
                throw new UrlGuardError(
                    error instanceof Error ? error.message : 'Upstream request failed',
                    'UPSTREAM_ERROR',
                );
            }

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                await response.body?.cancel().catch(() => undefined);
                if (!location) throw new UrlGuardError('Redirect without a location header', 'UPSTREAM_ERROR');
                const next = new URL(location, current);
                if (!ALLOWED_PROTOCOLS.has(next.protocol)) {
                    throw new UrlGuardError('Redirect to a non-http scheme', 'BLOCKED_SCHEME');
                }
                redirects.push(next.toString());
                current = next;
                continue;
            }

            const contentType = response.headers.get('content-type');
            if (opts.method !== 'HEAD' && contentType) {
                const base = contentType.split(';')[0].trim().toLowerCase();
                if (!opts.allowedContentTypes.includes(base)) {
                    await response.body?.cancel().catch(() => undefined);
                    throw new UrlGuardError(`Unsupported content type: ${base}`, 'UNSUPPORTED_CONTENT_TYPE');
                }
            }

            const declared = Number(response.headers.get('content-length') ?? '0');
            if (declared > opts.maxBytes) {
                await response.body?.cancel().catch(() => undefined);
                throw new UrlGuardError('Response larger than the scan limit', 'RESPONSE_TOO_LARGE');
            }

            const { text, bytes, truncated } = await readCapped(response, opts.maxBytes);

            return {
                url: originalUrl,
                finalUrl: current.toString(),
                status: response.status,
                contentType,
                body: text,
                bytes,
                truncated,
                elapsedMs: Date.now() - startedAt,
                redirects,
            };
        }
        throw new UrlGuardError('Too many redirects', 'TOO_MANY_REDIRECTS');
    } finally {
        clearTimeout(timer);
    }
}

async function readCapped(response: Response, maxBytes: number) {
    if (!response.body) return { text: '', bytes: 0, truncated: false };
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    let truncated = false;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        if (bytes + value.byteLength > maxBytes) {
            chunks.push(value.subarray(0, maxBytes - bytes));
            bytes = maxBytes;
            truncated = true;
            await reader.cancel().catch(() => undefined);
            break;
        }
        chunks.push(value);
        bytes += value.byteLength;
    }
    const merged = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return { text: new TextDecoder('utf-8', { fatal: false }).decode(merged), bytes, truncated };
}
