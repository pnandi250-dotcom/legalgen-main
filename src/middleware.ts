import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/dashboard/analytics']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

    if (isProtectedRoute) {
        const sessionCookie = request.cookies.get('__session')?.value ||
            request.cookies.get('firebaseSession')?.value
        if (!sessionCookie) {
            const url = new URL('/', request.url)
            url.searchParams.set('redirect', pathname)
            url.searchParams.set('authRequired', 'true')
            return NextResponse.redirect(url)
        }
    }
    return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }