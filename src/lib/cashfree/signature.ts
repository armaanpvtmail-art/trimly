import crypto from "crypto";

/**
 * Verify a Cashfree webhook signature.
 *
 * Cashfree computes: base64( HMAC-SHA256( timestamp + rawBody, secretKey ) )
 * and sends it in the `x-webhook-signature` header alongside
 * `x-webhook-timestamp`. We recompute and compare in constant time.
 */
export function verifyCashfreeSignature({
  timestamp,
  rawBody,
  signature,
  secret,
}: {
  timestamp: string;
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  if (!timestamp || !signature || !secret) return false;
  try {
    const payload = `${timestamp}${rawBody}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
