import type { NextConfig } from 'next';

/**
 * The only Next config. Delete next.config.mjs and src/app/next.config.js —
 * the latter set output:'export', which silently drops every API route (F-17).
 *
 * Changes from the previous config:
 *  - type errors fail the build again (F-09)
 *  - strict mode back on (F-13 was hidden by turning it off)
 *  - security headers, which did not exist (F-12)
 */
const isProd = process.env.NODE_ENV === 'production';

const csp = [
    "default-src 'self'",
    // Next injects inline bootstrap scripts; 'unsafe-inline' stays until you
    // adopt nonces. Tighten this once the inline handlers are gone.
    `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://apis.google.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://securetoken.googleapis.com wss://*.firebaseio.com",
    "frame-src https://*.firebaseapp.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    typescript: { ignoreBuildErrors: false },
    experimental: {
        // Keeps the Admin SDK out of the client bundle graph.
        serverActions: { bodySizeLimit: '1mb' },
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Content-Security-Policy', value: csp },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    ...(isProd
                        ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
                        : []),
                ],
            },
            {
                // Never cache an authenticated API response.
                source: '/api/:path*',
                headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
            },
        ];
    },
};

export default nextConfig;