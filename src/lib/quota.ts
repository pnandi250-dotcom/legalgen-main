/**
 * Server-side quotas. Fixes F-06: limits lived in localStorage and were
 * bypassed by editing one value in devtools.
 *
 * Counters are Firestore documents keyed by (subject, action, UTC day) and
 * incremented inside a transaction, so the limit holds across instances and
 * across devices. Anonymous callers are limited by hashed IP.
 */
import { createHash } from 'node:crypto';
import { adminDb, FieldValue } from '@/lib/firebase/admin';
import { ApiError } from '@/lib/api/errors';
import type { AuthedUser } from '@/lib/auth/require-user';

export type QuotaAction = 'scan' | 'generate' | 'hunt' | 'export';
export type Plan = 'anonymous' | 'free' | 'pro' | 'agency';

/** Daily allowances per plan. Tune here, not in the UI. */
export const DAILY_LIMITS: Record<Plan, Record<QuotaAction, number>> = {
    anonymous: { scan: 1, generate: 3, hunt: 1, export: 0 },
    free: { scan: 5, generate: 10, hunt: 5, export: 3 },
    pro: { scan: 100, generate: 200, hunt: 100, export: 200 },
    agency: { scan: 1000, generate: 2000, hunt: 1000, export: 2000 },
};

export interface QuotaResult {
    used: number;
    limit: number;
    remaining: number;
    resetsAt: string;
}

function utcDay(now = new Date()): string {
    return now.toISOString().slice(0, 10);
}

function nextUtcMidnight(now = new Date()): string {
    const next = new Date(now);
    next.setUTCHours(24, 0, 0, 0);
    return next.toISOString();
}

/** Hash the IP: rate limiting should not require storing raw addresses. */
export function subjectFor(user: AuthedUser | null, request: Request): { subject: string; plan: Plan } {
    if (user) return { subject: `uid:${user.uid}`, plan: user.plan };
    const forwarded = request.headers.get('x-forwarded-for') ?? '';
    const ip = forwarded.split(',')[0].trim() || 'unknown';
    const salt = process.env.QUOTA_IP_SALT ?? 'legalgen-dev-salt';
    const hashed = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
    return { subject: `ip:${hashed}`, plan: 'anonymous' };
}

/**
 * Atomically consume one unit of quota, or throw 429 with a reset time.
 * Call this BEFORE doing the expensive work.
 */
export async function consumeQuota(
    user: AuthedUser | null,
    request: Request,
    action: QuotaAction,
): Promise<QuotaResult> {
    const { subject, plan } = subjectFor(user, request);
    const limit = DAILY_LIMITS[plan][action];
    const day = utcDay();
    const resetsAt = nextUtcMidnight();

    if (limit <= 0) {
        throw new ApiError('QUOTA_EXCEEDED', upgradeMessage(plan, action), {
            plan,
            limit,
            used: 0,
            resetsAt,
        });
    }

    const ref = adminDb.collection('quotas').doc(`${subject}__${action}__${day}`);

    const used = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const current = (snap.exists ? (snap.data()?.count as number | undefined) : 0) ?? 0;
        if (current >= limit) return current;
        tx.set(
            ref,
            {
                subject,
                action,
                day,
                plan,
                count: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp(),
                // TTL policy on this field keeps the collection self-cleaning.
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            { merge: true },
        );
        return current + 1;
    });

    if (used > limit) {
        throw new ApiError('QUOTA_EXCEEDED', upgradeMessage(plan, action), { plan, limit, used: limit, resetsAt });
    }

    return { used, limit, remaining: Math.max(0, limit - used), resetsAt };
}

function upgradeMessage(plan: Plan, action: QuotaAction): string {
    const noun = action === 'scan' ? 'scans' : action === 'generate' ? 'documents' : action === 'hunt' ? 'searches' : 'exports';
    if (plan === 'anonymous') return `You have used today's free ${noun}. Sign in to get more.`;
    if (plan === 'free') return `You have used today's ${noun} on the free plan. Upgrade for a higher limit.`;
    return `Daily ${noun} limit reached. It resets at midnight UTC.`;
}

/** Read remaining quota without consuming it (for showing limits in the UI). */
export async function peekQuota(
    user: AuthedUser | null,
    request: Request,
    action: QuotaAction,
): Promise<QuotaResult> {
    const { subject, plan } = subjectFor(user, request);
    const limit = DAILY_LIMITS[plan][action];
    const snap = await adminDb.collection('quotas').doc(`${subject}__${action}__${utcDay()}`).get();
    const used = (snap.exists ? (snap.data()?.count as number | undefined) : 0) ?? 0;
    return { used, limit, remaining: Math.max(0, limit - used), resetsAt: nextUtcMidnight() };
}
