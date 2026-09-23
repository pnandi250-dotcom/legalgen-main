/**
 * POST /api/auth/session   — exchange an ID token for a session cookie.
 * DELETE /api/auth/session — sign out.
 *
 * Fixes the middleware half of F-05: middleware checked for a cookie that
 * nothing ever set, because Firebase web auth keeps tokens in IndexedDB.
 * This creates a real, verifiable, httpOnly session cookie.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin'; // ✅ Correct import
import { SESSION_COOKIE } from '@/lib/auth/require-user';
import { sessionRequest } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
    let idToken: string;
    try {
        idToken = sessionRequest.parse(await request.json()).idToken;
    } catch {
        return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Send an idToken.' } }, { status: 400 });
    }

    try {
        // Verify before minting: never trust a token we have not checked.
        const decoded = await getAdminAuth().verifyIdToken(idToken, true);
        
        // Reject stale sign-ins: the token must be minutes old, not days.
        if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in again to continue.' } },
                { status: 401 },
            );
        }

        // ✅ FIXED: createSessionCookie is a method on Auth, not on verifyIdToken result
        const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });
        
        const response = NextResponse.json({ success: true, data: { uid: decoded.uid } });
        response.cookies.set({
            name: SESSION_COOKIE,
            value: sessionCookie,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: FIVE_DAYS_MS / 1000,
        });
        return response;
    } catch (error) {
        console.error('Session creation failed:', error);
        return NextResponse.json(
            { success: false, error: { code: 'UNAUTHENTICATED', message: 'That sign-in could not be verified.' } },
            { status: 401 },
        );
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
        name: SESSION_COOKIE,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
    return response;
}