/**
 * Security utilities and production settings for Trimly.
 * Handles CSP, secure headers, cookie configuration, and rate limiting.
 */

import { type NextRequest, NextResponse } from 'next/server';

/**
 * Get production-ready NextAuth options with secure defaults.
 */
export const getSecureNextAuthConfig = () => ({
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
      },
    },
  },
});

/**
 * Admin JWT cookie options (separate from session cookies).
 */
export const getAdminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/admin',
  maxAge: 7 * 24 * 60 * 60, // 7 days
});

/**
 * Standard security headers for all responses.
 */
export const getSecurityHeaders = () => ({
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
});

/**
 * Build Content-Security-Policy header.
 */
export const buildCSPHeader = (nonce?: string): string => {
  const nonceAttr = nonce ? ` 'nonce-${nonce}'` : '';

  const directives = [
    `default-src 'self'`,
    `script-src 'self'${nonceAttr} https://cdn.cashfreepayments.com https://cdn.jsdelivr.net`,
    `style-src 'self'${nonceAttr} 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: https:`,
    `media-src 'self' blob:`,
    `frame-src 'self' https://cashfreepayments.com`,
    `connect-src 'self' https://api.cashfreepayments.com https://payments.cashfree.com`,
    `object-src 'none'`,
    `frame-ancestors 'self'`,
  ];

  if (process.env.CSP_REPORT_URI) {
    directives.push(`report-uri ${process.env.CSP_REPORT_URI}`);
  }

  return directives.join('; ');
};

/**
 * Simple in-memory rate limiter (Redis-backed in production recommended).
 * Uses token bucket algorithm.
 */
class RateLimiter {
  private store = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private readonly refillInterval: number; // ms

  constructor(maxTokens: number = 100, refillPerSecond: number = 10) {
    this.maxTokens = maxTokens;
    this.refillRate = refillPerSecond;
    this.refillInterval = 1000 / refillPerSecond;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    let bucket = this.store.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.store.set(key, bucket);
    }

    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = (timePassed / this.refillInterval) * this.refillRate;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}

/**
 * Auth endpoint rate limiter (strict: 5 attempts per 15 mins per IP).
 */
export const authLimiter = new RateLimiter(5, 0.33); // 5 tokens per 15 mins

/**
 * Public API rate limiter (moderate: 100 requests per minute per IP).
 */
export const apiLimiter = new RateLimiter(100, 1.67); // 100 per minute

/**
 * Extract IP from request headers (respects X-Forwarded-For from proxies).
 */
export const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.ip || request.headers.get('x-real-ip') || 'unknown';
};

/**
 * Create a rate-limited response.
 */
export const rateLimitedResponse = () =>
  NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      status: 429,
    },
    { status: 429 }
  );
