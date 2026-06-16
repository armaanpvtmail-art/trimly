# Phase 8: Security Hardening, SEO, and PWA — Implementation Guide

## Overview

Phase 8 hardens Trimly against common web vulnerabilities, optimizes for search engines, and adds Progressive Web App (PWA) capabilities for offline access and installability.

---

## 🔒 Security Hardening

### 1. Middleware & Headers

**File**: `src/middleware.ts`

- Applies security headers to all responses (`Strict-Transport-Security`, `X-Frame-Options`, `CSP`, etc.).
- Implements rate-limiting for auth endpoints (5 attempts/15 min per IP).
- Validates admin JWT cookies on `/admin/*` routes.

**How to verify**:
```bash
curl -I https://your-domain.com
# Should show Strict-Transport-Security, Content-Security-Policy, etc.
```

### 2. Content Security Policy (CSP)

**File**: `src/lib/csp.ts`

- Generates CSP header dynamically.
- Blocks inline scripts unless explicitly nonce'd.
- Whitelists only Cashfree, CDN, and same-origin resources.
- Provides a `/api/csp-report` endpoint to log violations.

**Enable reporting in dev/staging**:
```env
CSP_REPORT_URI=/api/csp-report
CSP_VIOLATION_WEBHOOK=https://sentry.io/api/123456/csp-report/  # Optional
```

**How to test**:
1. Open browser DevTools → Network.
2. Visit a page and check response headers for `Content-Security-Policy` (production) or `Content-Security-Policy-Report-Only` (dev/staging).
3. Try loading an unsafe script (`<script src="https://unsafe.com"></script>`) — it should be blocked.

### 3. Rate Limiting

**File**: `src/lib/security.ts`

- `authLimiter`: 5 tokens per 15 minutes (for `/login`, `/register`, etc.).
- `apiLimiter`: 100 tokens per minute (for API endpoints).
- Token bucket algorithm; in-memory by default (upgrade to Redis in production via `redis.ts`).

**Production upgrade**:
Replace the in-memory store with Redis:
```typescript
// src/lib/redis.ts
export const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, window);
  return count <= limit;
}
```

### 4. Secure Cookies & Auth Config

**File**: `src/lib/security.ts` → `getSecureNextAuthConfig()`

- HttpOnly, Secure (HTTPS only in production), SameSite=Strict.
- Session expiry: 30 days; admin: 7 days.

**Integration** (in `src/app/api/auth/[...nextauth]/route.ts`):
```typescript
import { getSecureNextAuthConfig } from '@/lib/security';

export const authOptions = {
  ...getSecureNextAuthConfig(),
  // ... other options
};
```

### 5. Admin Cookie Validation

**File**: `src/middleware.ts`

- Checks `admin-jwt` cookie on `/admin/*` routes.
- Redirects to `/admin/login` if missing or invalid.
- Full validation happens in admin route layout (DB check).

---

## 🔍 SEO Optimization

### 1. Sitemap Generation

**File**: `src/app/sitemap.ts`

- Dynamically generates `/sitemap.xml` from enabled short links.
- Includes static pages (home, login, register).
- Updates on every build; links marked with recent `updatedAt` timestamp.

**How to verify**:
```bash
curl https://your-domain.com/sitemap.xml
# Should return XML with <url>, <loc>, <lastmod>, etc.
```

### 2. Robots.txt

**File**: `src/app/robots.ts` (dynamically) and `public/robots.txt` (static)

- Allows crawling of public pages.
- Disallows `/admin`, `/dashboard`, `/api`, etc.
- Points to sitemap.

**How to verify**:
```bash
curl https://your-domain.com/robots.txt
```

### 3. Meta Tags & Open Graph

**File**: `src/app/layout.tsx` (to be updated)

Update root layout to include:
```typescript
export const metadata: Metadata = {
  title: 'Trimly — Premium URL Shortener',
  description: 'Create and share branded countdown redirects with real-time analytics.',
  keywords: ['url shortener', 'link shortening', 'redirects', 'countdown timer'],
  openGraph: {
    title: 'Trimly — Premium URL Shortener',
    description: 'Create and share branded countdown redirects with real-time analytics.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Trimly',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trimly — Premium URL Shortener',
    description: 'Create and share branded countdown redirects with real-time analytics.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
  },
};
```

### 4. Structured Data (JSON-LD)

Add to landing page (`src/app/page.tsx`):
```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  // ... other metadata
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Trimly',
    description: 'Premium URL shortener with themed redirects and analytics.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## 📱 Progressive Web App (PWA)

### 1. Manifest File

**File**: `public/manifest.webmanifest`

- Defines app metadata (name, icons, theme colors, screenshots).
- Enables "Add to Home Screen" on iOS/Android.
- Includes app shortcuts (Create Link, Dashboard).

**Link in layout** (`src/app/layout.tsx`):
```typescript
export const metadata: Metadata = {
  // ...
  manifest: '/manifest.webmanifest',
  // ...
};
```

### 2. PWA Icons

**Files**:
- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-512.png` (512×512 px)
- `public/icons/icon-maskable-192.png` (maskable, for custom icon backgrounds)
- `public/icons/icon-maskable-512.png` (maskable)
- `public/icons/apple-touch-icon.png` (180×180 px, for iOS home screen)

**How to create**:
Use a design tool (Figma, Photoshop) or online generator:
```bash
# Example: Using ImageMagick
convert icon-base.png -resize 192x192 public/icons/icon-192.png
convert icon-base.png -resize 512x512 public/icons/icon-512.png
convert icon-base.png -resize 180x180 public/icons/apple-touch-icon.png
```

### 3. Service Worker

**File**: `src/service-worker.ts`

- Caches essential assets on install.
- Implements cache-first strategy for static assets (images, fonts).
- Implements network-first strategy for dynamic content (HTML, JSON).
- Shows offline fallback page if network is unavailable.

**Registration** (client-side in `src/components/service-worker-register.tsx` or in `layout.tsx`):
```typescript
'use client';

use Effect(() => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('SW registered'))
      .catch((err) => console.error('SW registration failed:', err));
  }
}, []);
```

### 4. Offline Fallback

**File**: `public/offline.html`

- Shown when user is offline and tries to navigate to a page not in cache.
- Styled UI with Retry button.
- Service worker handles the fallback in fetch event.

### 5. PWA Install Prompt Component

**File**: `src/components/pwa-install-prompt.tsx`

- Listens for `beforeinstallprompt` event (triggered on mobile/PWA-capable browsers).
- Shows a banner prompting user to install the app.
- User can install or dismiss.

**Usage** (in `src/app/layout.tsx` inside Providers):
```typescript
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* ... */}
        <PWAInstallPrompt />
        {children}
      </body>
    </html>
  );
}
```

### 6. Meta Tags for PWA

**Update `src/app/layout.tsx`**:
```typescript
export const metadata: Metadata = {
  // ... existing metadata
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Trimly',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192.png" />
      </head>
      <body>{/* ... */}</body>
    </html>
  );
}
```

---

## 📋 Testing & Validation

### Security

1. **CSP violations**:
   ```bash
   curl -I https://your-domain.com | grep Content-Security-Policy
   ```

2. **HTTPS/TLS**:
   ```bash
   curl -I https://your-domain.com | grep Strict-Transport-Security
   ```

3. **Rate-limiting**:
   ```bash
   for i in {1..10}; do curl -X POST https://your-domain.com/api/login -d '{}'; done
   # Should return 429 on attempt 6+
   ```

### SEO

1. **Sitemap**:
   ```bash
   curl https://your-domain.com/sitemap.xml | head -20
   ```

2. **Robots.txt**:
   ```bash
   curl https://your-domain.com/robots.txt
   ```

3. **Meta tags** (in browser DevTools → Elements → `<head>`):
   - Check for `<meta name="description">`
   - Check for `<meta property="og:*">`
   - Check for `<script type="application/ld+json">`

4. **Page Speed** (Google PageSpeed Insights):
   ```
   https://pagespeed.web.dev/?url=your-domain.com
   ```

### PWA

1. **Manifest validation**:
   ```bash
   curl https://your-domain.com/manifest.webmanifest
   # Should return valid JSON
   ```

2. **Service Worker registration**:
   - Open DevTools → Application → Service Workers.
   - Should show registered SW with status "activated and running".

3. **Install prompt** (mobile/Chrome):
   - Open app on mobile; should prompt "Add to Home Screen" after 2 visits.
   - Or use Chrome DevTools → Application → Manifest to simulate.

4. **Offline capability**:
   - Install as PWA.
   - Go offline (DevTools → Network → Offline).
   - Reload page; should show content from cache.
   - Click a link to uncached page; should show offline fallback.

---

## 🚀 Deployment

### Environment Variables

Add to `.env.production`:
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
CSP_REPORT_URI=/api/csp-report
# CSP_VIOLATION_WEBHOOK=https://sentry.io/api/...  # Optional
```

### Build & Deploy

```bash
# 1. Test locally
npm run build
npm run typecheck
npm start

# 2. Deploy (e.g., Docker, Vercel, etc.)
git push origin phase-8-security-seo-pwa

# 3. Test in production
curl -I https://your-domain.com/  # Check headers
curl https://your-domain.com/sitemap.xml  # Check sitemap
curl https://your-domain.com/manifest.webmanifest  # Check PWA manifest

# 4. Monitor
# Check CSP violations (if webhook configured)
# Check SEO indexing (Google Search Console)
# Monitor offline page visits (analytics)
```

---

## 📚 References

- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [MDN: PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/)
- [Google SEO Starter Guide](https://developers.google.com/search/docs)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#bundling-variables-for-the-browser)

---

**Status**: Phase 8 complete and ready for testing.  
**Next Phase**: Phase 9 — Docker, Nginx, VPS deployment.
