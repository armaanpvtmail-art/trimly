# Security Policy — Trimly

## Overview

Trimly is a production-grade SaaS platform with security hardening across authentication, encryption, rate-limiting, and content security. This document outlines our security practices, incident response, and best practices for deployment.

---

## 🔐 Security Practices

### 1. Authentication & Authorization

- **NextAuth.js** with JWT-backed sessions, secure cookies (HttpOnly, Secure, SameSite=Strict).
- **Password hashing**: bcrypt with 12 rounds; passwords never logged or stored plaintext.
- **Admin authentication**: Separate JWT cookie (`admin-jwt`, 7-day expiry, path-restricted).
- **Audit logging**: All auth events (login, register, password change) recorded with IP, user agent, and timestamp.
- **Session timeout**: User sessions expire after 30 days; admin sessions after 7 days.

### 2. Secrets & Environment Variables

- **Never committed**: All secrets (`DATABASE_URL`, `NEXTAUTH_SECRET`, Cashfree keys, SMTP credentials) live in `.env` and environment variables only.
- **Rotation strategy**:
  - Change `NEXTAUTH_SECRET` every 6 months (or immediately if suspected compromise).
  - Rotate Cashfree API keys quarterly via Cashfree dashboard.
  - Regenerate webhook secrets if a webhook is compromised.
- **Access control**: Secrets restricted to deployment environment; no local fallbacks in production.

### 3. Transport Security

- **HTTPS/TLS**: All traffic encrypted; deployment enforces TLS 1.2+.
- **HSTS**: Strict-Transport-Security header with 1-year max-age and preload.
- **Certificate management**: Automated renewal via Let's Encrypt (Certbot) on Ubuntu VPS; renewed monthly.

### 4. Content Security

- **CSP (Content-Security-Policy)**:
  - `default-src 'self'` — blocks inline scripts by default.
  - Whitelisted only: Cashfree Payments, CDN assets (Recharts, Framer Motion).
  - `report-uri /api/csp-report` — violations logged for monitoring (dev/staging).
  - Production: CSP-Report-Only mode with webhook for incident alerts.
- **X-Frame-Options**: `SAMEORIGIN` — blocks clickjacking.
- **X-Content-Type-Options**: `nosniff` — prevents MIME sniffing.
- **Referrer-Policy**: `strict-origin-when-cross-origin` — limits referrer leaks.

### 5. Input Validation & Sanitization

- **Zod schemas**: All API/form inputs validated with Zod before database queries.
- **Theme uploads**: ZIP files scanned for path traversal (`../../`), disallowed file types (`.exe`, `.sh`, etc.), size limits (10 MB per file, 50 MB total).
- **User-generated content**: No raw HTML rendering; countdown themes rendered in `<iframe sandbox>` with CSP.
- **SQL injection**: Prisma ORM prevents SQL injection; no raw queries used.

### 6. Rate Limiting

- **Auth endpoints** (`/login`, `/register`, `/forgot-password`): 5 attempts per 15 minutes per IP.
- **API endpoints**: 100 requests per minute per IP.
- **Webhook delivery**: Cashfree retries with exponential backoff; duplicate prevention via unique `cfPaymentId`.
- **Implementation**: In-memory token bucket (production: Redis-backed).

### 7. Database Security

- **PostgreSQL only**: No other databases supported; harden with strong credentials and network isolation.
- **Prepared statements**: Prisma ensures parameterized queries.
- **Encryption at rest**: Enable PostgreSQL SSL connections and OS-level encryption (Ubuntu LVM).
- **Backups**: Daily automated backups; encrypted and stored off-site.
- **Principle of least privilege**: Separate DB user for the app (limited to `trimly` database, no superuser).

### 8. Cache Security (Redis)

- **Credentials**: Redis password (strong, 32+ characters) stored in environment variables.
- **Network isolation**: Redis only accessible from the app container (no external access).
- **No sensitive data**: Cache stores only short-link slugs and session metadata; never passwords or secrets.
- **TTL enforcement**: Cached data expires automatically; `FLUSHDB` available for emergency cache clear.

### 9. Admin Panel Security

- **Separate authentication**: Admin JWT cookie independent of user sessions.
- **Audit trails**: Every admin action (user suspend, payment extend, settings change) logged with admin ID, timestamp, and IP.
- **IP whitelisting** (optional): Configure `ADMIN_IP_WHITELIST` environment variable for strict access.
- **Audit log retention**: 2 years default; configure `AUDIT_LOG_RETENTION_DAYS`.

### 10. Webhook Security (Cashfree)

- **Signature verification**: All webhooks validated with HMAC-SHA256 using `CASHFREE_WEBHOOK_SECRET`.
- **Idempotency**: Unique `cfPaymentId` ensures duplicate webhooks don't double-charge.
- **Timestamp validation**: Webhook timestamp checked to prevent replay attacks (10-minute window).
- **Logging**: All webhook events (success, failure, retries) recorded in `ActivityLog`.

### 11. Third-Party Integrations

- **Cashfree**: Production mode only; API v2023-08-01. Credentials rotated quarterly.
- **SMTP (Nodemailer)**: Credentials stored in environment variables; TLS enforced.
- **CDN**: Only trusted CDNs whitelisted in CSP (jsdelivr.net for Recharts, cdn.cashfreepayments.com).

### 12. Dependency Security

- **npm audit**: Run `npm audit` before each deployment; fix high/critical vulnerabilities immediately.
- **Dependabot**: GitHub automated dependency updates; review and merge weekly.
- **Lock file**: `package-lock.json` committed; reproducible builds guaranteed.
- **Minimal dependencies**: Prefer built-in Node/Next.js APIs; vendor only when necessary.

---

## 🚨 Incident Response

### Security Issue Reporting

**Do not open a public GitHub issue for security vulnerabilities.**

1. **Email**: Contact `security@trimly.app` with:
   - Description of the vulnerability.
   - Affected component(s) and version(s).
   - Proof-of-concept or steps to reproduce.
   - Suggested fix (if available).

2. **Response timeline**:
   - Acknowledgment within 24 hours.
   - Initial assessment within 48 hours.
   - Patch release and disclosure within 7–14 days (depending on severity).

3. **Responsible disclosure**: Coordinate with us before public disclosure; we'll credit you in the release notes if desired.

### Incident Classification

| Severity | Example | Response Time |
|----------|---------|----------------|
| **Critical** | RCE, authentication bypass, data exposure | 24 hours |
| **High** | SQL injection, privilege escalation, XSS | 3 days |
| **Medium** | Information disclosure, DoS | 7 days |
| **Low** | Minor security misconfiguration | 14 days |

### Post-Incident

1. **Root cause analysis**: Document what happened, why, and how to prevent recurrence.
2. **Notification**: If user data was affected, notify users within 72 hours (GDPR/local compliance).
3. **Patch deployment**: All deployments include the security fix; deployment is automatic for critical issues.
4. **Public disclosure**: A security advisory is published on GitHub (after patches are available).

---

## 🛡️ Deployment Checklist

### Pre-Production

- [ ] `NEXTAUTH_SECRET` is a 32+ character random string (e.g., `openssl rand -base64 32`).
- [ ] `NODE_ENV=production` in environment variables.
- [ ] `CASHFREE_ENV=PRODUCTION` and API keys are production-mode keys.
- [ ] `CASHFREE_WEBHOOK_SECRET` is set and matches Cashfree dashboard.
- [ ] `DATABASE_URL` uses strong password (32+ random characters) and is only accessible from the app.
- [ ] Redis password is set to a strong value (32+ characters).
- [ ] SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) configured.
- [ ] `SMTP_FROM_EMAIL` is verified (e.g., SES verified identity).
- [ ] Backups are configured and tested (full restore tested on staging).
- [ ] TLS certificate is valid and will auto-renew (check `/etc/letsencrypt/renewal/` on Ubuntu).
- [ ] Firewall rules are configured (only 80, 443 ingress; Redis/DB only from internal network).

### On Deployment

- [ ] Run `npm audit` and fix any high/critical vulnerabilities.
- [ ] Run `npm run typecheck` to ensure no TypeScript errors.
- [ ] Run `npm run build` and verify build succeeds.
- [ ] Load-test with simulated traffic (at least 1000 req/s).
- [ ] Test webhook delivery with Cashfree test environment (order creation → payment → webhook).
- [ ] Test 2FA/email verification with real SMTP credentials.
- [ ] Monitor logs for errors: `docker logs -f trimly-app` (or systemd logs).
- [ ] Enable monitoring/alerting: set up Sentry (or similar) for real-time error tracking.

### Post-Deployment

- [ ] Monitor CSP violations (if report-uri is configured).
- [ ] Check for unauthorized admin logins in audit logs.
- [ ] Verify Cashfree webhooks are being received (count should increase).
- [ ] Test a production payment end-to-end (create order → pay → verify → activate subscription).
- [ ] Monitor database size and query performance; optimize if needed.
- [ ] Schedule monthly security audit reviews (check logs, review new dependencies).

---

## 📚 Best Practices for Users

### Admin Users

1. **Use a strong admin password**: 16+ characters, mix of upper/lower/numbers/symbols.
2. **Change password periodically**: At least every 3 months.
3. **Protect your API keys**: Never share Cashfree or SMTP secrets; rotate if leaked.
4. **Monitor audit logs**: Review weekly for suspicious activity (impossible geographic logins, bulk user deletions, etc.).
5. **Update settings**: Keep Cashfree API keys and SMTP credentials current.

### Regular Users

1. **Enable email verification**: Always verify your email; this prevents account takeover.
2. **Use strong passwords**: 12+ characters with mixed case, numbers, and symbols.
3. **Keep sessions secure**: Log out after sensitive operations; don't share links with session tokens.
4. **Review active links**: Periodically check `My Links` for suspicious entries.
5. **Report abuse**: If you see links spreading malware or phishing, report them immediately.

---

## 🔄 Updates & Versioning

- **Security patches**: Released as patch versions (e.g., 1.0.1 → 1.0.2).
- **Major updates**: Released quarterly; always include security improvements.
- **Long-term support (LTS)**: Previous major version receives security patches for 12 months after release.

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE: Common Weakness Enumeration](https://cwe.mitre.org/)
- [Prisma Security Guide](https://www.prisma.io/docs/concepts/more/security)
- [Next.js Security Best Practices](https://nextjs.org/learn/seo/introduction-to-seo)
- [Cashfree Security Documentation](https://docs.cashfreepayments.com/)

---

**Last updated**: 2024-12-16  
**Status**: Production-Ready
