import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for Security Headers
 * Applies to all routes for comprehensive protection
 */

export function middleware(request) {
    const response = NextResponse.next();

    // Security Headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Content Security Policy (CSP)
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://fonts.googleapis.com",
            "frame-ancestors 'none'",
        ].join('; ')
    );

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    return response;
}

// Apply middleware to all routes except static files
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
