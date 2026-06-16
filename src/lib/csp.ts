/**
 * Content-Security-Policy (CSP) utilities.
 * Handles CSP header generation, nonce generation, and violation reporting.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a cryptographically secure nonce for inline scripts/styles.
 */
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

/**
 * Log CSP violations (for monitoring).
 */
export async function handleCSPViolation(violation: {
  'document-uri'?: string;
  'violated-directive'?: string;
  'effective-directive'?: string;
  'original-policy'?: string;
  'disposition'?: string;
  'blocked-uri'?: string;
  'status-code'?: number;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
  'disposition'?: string;
}) {
  // In production, send to a monitoring service (e.g., Sentry, custom endpoint).
  console.warn('[CSP Violation]', violation);

  if (process.env.CSP_VIOLATION_WEBHOOK) {
    try {
      await fetch(process.env.CSP_VIOLATION_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          violation,
        }),
      });
    } catch (err) {
      console.error('Failed to report CSP violation:', err);
    }
  }
}

/**
 * CSP Report-Only endpoint to capture violations without enforcing them.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cspReport = body['csp-report'];

    if (cspReport) {
      await handleCSPViolation(cspReport);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('CSP report parsing failed:', err);
    return NextResponse.json({ error: 'Invalid CSP report' }, { status: 400 });
  }
}
