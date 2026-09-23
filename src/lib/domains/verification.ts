/**
 * Real domain-ownership verification. Fixes F-06: ownership previously lived
 * in localStorage with a Math.random() token, and nothing was ever fetched or
 * resolved to confirm it.
 *
 * start() issues a crypto-random token stored server-side; check() proves
 * control via the challenge file, a TXT record, or a meta tag, then marks
 * verified with Admin credentials — exactly what the existing
 * firestore.rules comment anticipated.
 */
import { randomBytes } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { getAdminDb, FieldValue, Timestamp } from '@/lib/firebase/admin';
import { COLLECTIONS, type VerificationMethod } from '@/lib/data/schema';
import { safeFetch } from '@/lib/security/url-guard';
import { ApiError, forbidden, notFound } from '@/lib/api/errors';
import type { AuthedUser } from '@/lib/auth/require-user';

const TOKEN_PREFIX = 'legalgen-site-verification';
const TTL_HOURS = 72;
const MAX_ATTEMPTS = 30;

export function normaliseDomain(input: string): string {
    return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

export interface VerificationInstructions {
    verificationId: string;
    domain: string;
    method: VerificationMethod;
    token: string;
    instruction: string;
    expiresAt: string;
}

export async function startVerification(
    user: AuthedUser,
    domainInput: string,
    method: VerificationMethod,
): Promise<VerificationInstructions> {
    const db = getAdminDb(); // ✅ ADDED THIS LINE
    const domain = normaliseDomain(domainInput);
    const token = `${TOKEN_PREFIX}=${randomBytes(24).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
    const ref = db.collection(COLLECTIONS.domainVerifications).doc(); // ✅ CHANGED adminDb TO db

    await ref.set({
        id: ref.id,
        uid: user.uid,
        domain,
        method,
        token,
        verified: false,
        attempts: 0,
        lastCheckedAt: null,
        lastError: null,
        createdAt: FieldValue.serverTimestamp(),
        verifiedAt: null,
        expiresAt,
    });

    return {
        verificationId: ref.id,
        domain,
        method,
        token,
        instruction: instructionFor(domain, method, token),
        expiresAt: expiresAt.toISOString(),
    };
}

function instructionFor(domain: string, method: VerificationMethod, token: string): string {
    if (method === 'dns') {
        return `Add a TXT record on ${domain} with the value: ${token}. DNS changes can take up to an hour.`;
    }
    if (method === 'file') {
        return `Upload a file at https://${domain}/.well-known/legalgen-verification.txt containing exactly: ${token}`;
    }
    return `Add this tag inside <head> on https://${domain}: <meta name="legalgen-site-verification" content="${token.split('=')[1]}">`;
}

export interface VerificationOutcome {
    verified: boolean;
    domain: string;
    method: VerificationMethod;
    reason?: string;
}

export async function checkVerification(user: AuthedUser, verificationId: string): Promise<VerificationOutcome> {
    const db = getAdminDb(); // ✅ ADDED THIS LINE
    const ref = db.collection(COLLECTIONS.domainVerifications).doc(verificationId); // ✅ CHANGED adminDb TO db
    const snap = await ref.get();
    if (!snap.exists) throw notFound('That verification request no longer exists. Start a new one.');

    const record = snap.data()!;
    if (record.uid !== user.uid) throw forbidden('That verification belongs to another account.');
    if (record.verified) return { verified: true, domain: record.domain, method: record.method };
    if (record.expiresAt?.toDate?.() && record.expiresAt.toDate() < new Date()) {
        throw new ApiError('BAD_REQUEST', 'That verification expired. Start a new one.');
    }
    if ((record.attempts ?? 0) >= MAX_ATTEMPTS) {
        throw new ApiError('RATE_LIMITED', 'Too many verification attempts. Start a new verification.');
    }

    const { domain, method, token } = record as { domain: string; method: VerificationMethod; token: string };
    const outcome = await proveControl(domain, method, token);

    await ref.update({
        attempts: FieldValue.increment(1),
        lastCheckedAt: FieldValue.serverTimestamp(),
        lastError: outcome.verified ? null : (outcome.reason ?? 'Not found'),
        ...(outcome.verified ? { verified: true, verifiedAt: FieldValue.serverTimestamp() } : {}),
    });

    return { ...outcome, domain, method };
}

async function proveControl(
    domain: string,
    method: VerificationMethod,
    token: string,
): Promise<{ verified: boolean; reason?: string }> {
    try {
        if (method === 'dns') {
            const records = await resolveTxt(domain);
            const flat = records.map((chunks) => chunks.join(''));
            return flat.some((value) => value.trim() === token)
                ? { verified: true }
                : { verified: false, reason: 'No matching TXT record yet. DNS can take up to an hour to propagate.' };
        }

        if (method === 'file') {
            const result = await safeFetch(`https://${domain}/.well-known/legalgen-verification.txt`, {
                allowedContentTypes: ['text/plain', 'text/html', 'application/octet-stream'],
                maxBytes: 4096,
                timeoutMs: 8000,
            });
            if (result.status !== 200) return { verified: false, reason: `The file returned HTTP ${result.status}.` };
            return result.body.trim() === token
                ? { verified: true }
                : { verified: false, reason: 'The file exists but its contents do not match the token.' };
        }

        const result = await safeFetch(`https://${domain}/`, { maxBytes: 512 * 1024, timeoutMs: 10_000 });
        const expected = token.split('=')[1];
        const pattern = new RegExp(
            `<meta[^>]+name=["']legalgen-site-verification["'][^>]+content=["']${escapeRegex(expected)}["']`,
            'i',
        );
        return pattern.test(result.body)
            ? { verified: true }
            : { verified: false, reason: 'The meta tag was not found on the homepage.' };
    } catch (error) {
        return { verified: false, reason: error instanceof Error ? error.message : 'The check could not be completed.' };
    }
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Is this user's domain verified? */
export async function isDomainVerified(uid: string, domain: string): Promise<boolean> {
    const db = getAdminDb(); // ✅ ADDED THIS LINE
    const snap = await db // ✅ CHANGED adminDb TO db
        .collection(COLLECTIONS.domainVerifications)
        .where('uid', '==', uid)
        .where('domain', '==', normaliseDomain(domain))
        .where('verified', '==', true)
        .limit(1)
        .get();
    return !snap.empty;
}