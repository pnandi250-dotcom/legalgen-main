/**
 * Verifies a Firebase ID token on the server. Fixes F-05.
 *
 * The client sends: Authorization: Bearer <await user.getIdToken()>
 * Session-cookie callers (see /api/auth/session) are also accepted so the
 * middleware and server components can share one identity model.
 */
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { unauthenticated } from '@/lib/api/errors';

export const SESSION_COOKIE = '__session';

export interface AuthedUser {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    /** Custom claims: plan and organisation live here, set server-side only. */
    plan: 'free' | 'pro' | 'agency';
    orgId: string | null;
}

function toUser(claims: Record<string, unknown> & { uid: string }): AuthedUser {
    const plan = claims.plan;
    return {
        uid: claims.uid,
        email: (claims.email as string | undefined) ?? null,
        emailVerified: Boolean(claims.email_verified),
        plan: plan === 'pro' || plan === 'agency' ? plan : 'free',
        orgId: (claims.orgId as string | undefined) ?? null,
    };
}

/** Returns the caller, or null when unauthenticated. Never throws on absence. */
export async function getUser(request: NextRequest | Request): Promise<AuthedUser | null> {
    const header = request.headers.get('authorization');
    if (header?.toLowerCase().startsWith('bearer ')) {
        const token = header.slice(7).trim();
        try {
            // ✅ FIXED: Added 'await' here
            const decoded = await getAdminAuth().verifyIdToken(token, true);
            return toUser(decoded as never);
        } catch {
            return null;
        }
    }
    try {
        const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
        if (!cookie) return null;
        // ✅ FIXED: Added 'await' here for session cookie verification too
        const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
        return toUser(decoded as never);
    } catch {
        return null;
    }
}

/** 
 * Returns the caller or throws 401. Use in every route that costs money. 
 * ✅ ADDED THIS FUNCTION TO FIX BUILD ERROR
 */
export async function requireUser(request: NextRequest | Request): Promise<AuthedUser> {
    const user = await getUser(request);
    if (!user) throw unauthenticated();
    return user;
}