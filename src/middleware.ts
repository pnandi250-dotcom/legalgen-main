/**
 * Edge middleware. Fixes the second half of F-05: this used to treat the mere
 * PRESENCE of a cookie as proof of sign-in, and the cookie it looked for was
 * never set by anything.
 *
 * Edge runtime cannot verify a Firebase session cookie (no Node crypto, no
 * Admin SDK), so middleware does exactly one honest job: cheap redirect for
 * callers with no session at all. Real verification happens in the route or
 * server component via requireUser(), which is where authorisation belongs.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = '__session';

export function middleware(request: NextRequest) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (hasSession) return NextResponse.next();

    const url = new URL('/', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    url.searchParams.set('authRequired', 'true');
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ['/dashboard/:path*', '/documents/:path*'],
};
