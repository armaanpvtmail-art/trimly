/**
 * Middleware for Trimly: authentication, rate-limiting, and security headers.
 */

import { withAuth } from 'next-auth/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, buildCSPHeader, getClientIP, authLimiter } from '@/lib/security';

/**
 * Paths that require user authentication.
 */
const protectedPaths = [
  '/dashboard',
  '/create',
  '/links',
  '/analytics',
  '/themes',
  '/subscribe',
  '/profile',
];

/**
 * Paths that require admin authentication.
 */
const adminPaths = ['/admin'];

/**
 * Main middleware handler.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  // Apply security headers to all responses.
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });

  // Apply CSP header.
  const csp = buildCSPHeader();
  response.headers.set('Content-Security-Policy', csp);

  // Add CSP Report-Only for development/staging (optional).
  if (process.env.NODE_ENV !== 'production') {
    response.headers.set('Content-Security-Policy-Report-Only', csp + ' report-uri /api/csp-report');
  }

  // Rate-limit auth endpoints.
  if (pathname.match(/^\/(login|register|forgot-password|reset-password)/)) {
    const ip = getClientIP(request);
    if (!authLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // Admin cookie verification (basic check; NextAuth does full validation).
  if (adminPaths.some((path) => pathname.startsWith(path))) {
    const adminToken = request.cookies.get('admin-jwt')?.value;
    if (!adminToken && pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

/**
 * Apply middleware to specific routes.
 */
export const config = {
  matcher: [
    // Protected user routes.
    '/dashboard/:path*',
    '/create/:path*',
    '/links/:path*',
    '/analytics/:path*',
    '/themes/:path*',
    '/subscribe/:path*',
    '/profile/:path*',
    // Admin routes.
    '/admin/:path*',
    // Auth routes (for rate-limiting).
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    // API routes (for CSP/security headers).
    '/api/:path*',
  ],
};
