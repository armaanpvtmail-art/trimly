# Trimly — Premium URL Shortener SaaS

A production-grade, multi-tenant URL shortener with **themed countdown redirects**,
**real-time analytics**, a **₹90 Cashfree subscription gate**, a polished user
dashboard, and a complete **admin panel**.

Built with the polish of Linear / Vercel / Stripe — glassmorphism, gradients,
smooth Framer Motion animations, dark + light mode, skeleton loaders, and toast
notifications throughout.

> **Status:** Built in checkpointed phases. This checkpoint delivers
> **Phase 0 (foundation/scaffold)** and **Phase 1 (database schema)**.
> See the roadmap below for what lands next.

---

## ✨ Tech stack

| Layer        | Choice                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Framework    | Next.js 15 (App Router) · React 19 · TypeScript                        |
| Styling      | Tailwind CSS · ShadCN UI (new-york) · Framer Motion · Lucide           |
| Charts       | Recharts                                                               |
| Backend      | Next.js Server Actions + Route Handlers                                |
| ORM          | Prisma 6                                                               |
| Database     | **PostgreSQL only**                                                    |
| Auth         | NextAuth (Credentials, JWT sessions)                                   |
| Payments     | Cashfree Payment Gateway (production mode)                             |
| Cache / RL   | Redis (ioredis)                                                        |
| Deployment   | Docker · Docker Compose · Nginx · Ubuntu VPS · SSL                     |

---

## 📁 Folder structure

```
trimly/
├── prisma/
│   ├── schema.prisma          # 11 models + auth tables, enums, indexes, cascades
│   └── seed.ts                # admin bootstrap, website settings, system themes, demo data
├── public/
│   ├── uploads/themes/        # extracted admin-uploaded theme assets (runtime)
│   ├── themes/                # built-in system theme previews
│   └── icons/                 # PWA icons
├── src/
│   ├── app/
│   │   ├── layout.tsx         # root layout, fonts, metadata, providers
│   │   ├── globals.css        # design tokens (light/dark) + premium primitives
│   │   ├── page.tsx           # marketing landing page (with splash)
│   │   └── providers.tsx      # SessionProvider + ThemeProvider + Toaster
│   ├── components/
│   │   ├── ui/                # ShadCN primitives (button, card, input, ...)
│   │   ├── brand/             # logo, splash screen
│   │   ├── providers/         # theme provider
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── redis.ts           # Redis singleton + cache helpers
│   │   ├── env.ts             # zod-validated env access
│   │   └── utils.ts           # cn(), formatINR(), date helpers, ...
│   └── types/
├── .env.example               # all required environment variables
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

> Later phases add `src/app/(auth)`, `src/app/(dashboard)`, `src/app/admin`,
> `src/app/[slug]` (themed redirect), `src/app/api/**` route handlers,
> `src/server/**` (actions & services), Docker, and Nginx config.

---

## 🗄️ Database models (Phase 1)

`User`, `Admin`, `Subscription`, `Payment`, `CashfreeOrder`, `ShortLink`,
`LinkAnalytics`, `Theme`, `ThemeAsset`, `WebsiteSettings`, `ActivityLog`
— plus `EmailVerificationToken` and `PasswordResetToken`.

All relations use explicit foreign keys with sensible cascade rules
(e.g. deleting a user cascades to their links/analytics/subscriptions, while
audit logs are preserved with `SetNull`). Hot lookup columns are indexed.

---

## 🔑 Authentication & gating (Phase 2)

- **NextAuth** Credentials provider with **JWT sessions** (`src/lib/auth/`).
- **Register** (`/register`) → server action hashes the password (bcrypt, 12
  rounds), creates the user, emails a verification link, then auto signs-in.
- **Login** (`/login`) — split-screen, "keep me signed in", maps suspended /
  invalid errors to friendly toasts.
- **Forgot / reset password** (`/forgot-password`, `/reset-password`) — tokenised
  (1h expiry), no account-enumeration leak.
- **Email verification** (`/verify-email?token=…`) — 24h token, works logged-in
  or out.
- **Branded transactional emails** via SMTP (`src/lib/mail.ts`); if SMTP isn't
  configured the link is logged to the server console so dev flows still work.
- **Gating:** edge `middleware.ts` requires auth for `/dashboard`, `/create`,
  `/links`, … and the **subscription gate** lives in the dashboard server
  layout (`requireActiveSubscription()`) → unsubscribed users are sent to
  `/subscribe` (the Premium Access paywall).
- **Audit logging:** logins, registrations and password events are written to
  `ActivityLog`.

> Routing intent: splash (on `/`) → session check → `/login` if anonymous;
> authenticated users hitting auth pages are bounced to `/dashboard`, and the
> subscription gate then routes them to `/subscribe` until they have an active
> plan.

## 💳 Payments — Cashfree (Phase 3)

Production-mode Cashfree PG integration (API version `2023-08-01`).

**Flow:** Subscribe → `createSubscriptionOrder` (server action) creates a
`CashfreeOrder` row + Cashfree order → client opens **hosted checkout**
(`@cashfreepayments/cashfree-js`) → Cashfree redirects to
`/payment/return?order_id=…` → the page **polls** `/api/payment/status`, which
**authoritatively verifies** the order against Cashfree and activates the plan.

**Two activation paths, both idempotent:**
1. **Webhook** `POST /api/webhooks/cashfree` — verifies the `x-webhook-signature`
   HMAC over `timestamp + rawBody`, then records the payment & activates.
2. **Return verification** — server-side `getOrder` + `getOrderPayments`, never
   trusting client redirect params.

Idempotency is guaranteed by the **unique `Payment.cfPaymentId`** — duplicate
webhooks, retries, and webhook↔return races all resolve to a single activation
inside a DB transaction. New subscriptions are created; existing active ones are
**extended** (renewals). Failed / dropped / cancelled outcomes are recorded for
audit and never activate.

**Setup on your server:**
- Set `CASHFREE_ENV=PRODUCTION`, `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`.
- In the Cashfree dashboard → Developers → **Webhooks**, add
  `https://YOUR_DOMAIN/api/webhooks/cashfree` and copy its secret into
  `CASHFREE_WEBHOOK_SECRET`.
- The return URL (`/payment/return`) is configured automatically per order.

## 📊 Dashboard (Phase 4)

A premium, responsive app shell (`src/components/dashboard/`):
- **Sidebar** (desktop) + **bottom nav** (mobile), active-route highlighting,
  avatar **user menu**, theme toggle, and a plan-status card.
- **Home** — animated KPI cards (links, clicks, today, plan) + a 14-day Recharts
  area chart + recent links + recent activity.
- **Create Link** — destination URL, optional title, optional custom slug
  (validated, reserved-word protected), **theme picker**, **countdown** selector
  → result card with short URL, **copy**, **QR (PNG download)**, **share**.
- **My Links** — searchable / filterable / sortable table with inline
  **enable-disable toggle**, **edit** dialog, **delete** confirm, copy & QR.
- **Analytics** — overview KPIs, 30-day chart, top-performing links.
- **Themes** — gallery of available redirect themes.
- **Subscription** — current plan, cycle progress, renew/buy-again (Cashfree),
  full payment history.
- **Profile** — update name, change password (current-password verified),
  membership summary.

All mutations run through type-safe **server actions** (`src/server/actions/`)
with zod validation, Redis cache invalidation, audit logging, and
`revalidatePath`.

## 🔀 Redirect engine & analytics (Phase 5)

- **Public route** `app/[slug]/page.tsx` (force-dynamic, `noindex`) resolves the
  slug via a **Redis-cached** lookup (`resolveLink`, invalidated on edit/disable).
- Renders a **themed countdown experience** (`RedirectExperience`): gradient or
  uploaded background/video/logo, an animated countdown ring, and a **Continue
  now** button. `countdown = 0` redirects instantly.
- Missing / disabled / expired links get a branded **unavailable** page.
- **Per-click capture** (`recordClick`): UA parsing (device/browser/OS) via
  `ua-parser-js`, geo from edge headers (Vercel/Cloudflare), **hashed IP** for
  unique counting (never stored raw), referrer, and bot/prefetch filtering.
  Updates denormalised `clickCount` / `uniqueCount` in a transaction.
- **Detailed analytics** at `/analytics/[id]`: 30-day timeseries, device donut,
  and country / city / browser / OS / referrer breakdowns + recent clicks.

## 🛡️ Admin panel (Phase 6)

A fully **separate** admin area at `/admin` with its own authentication —
independent of user sessions.

- **Admin auth** — `Admin` table + a signed **JWT cookie** (`jose`, HS256).
  Edge middleware verifies the cookie for every `/admin/*` route (except
  `/admin/login`); the panel layout re-checks the admin in the DB.
- **Dashboard** — total users, active subscriptions, **revenue**, links, clicks,
  a 30-day signups chart, and recent payments.
- **Users** — search/filter, suspend / activate, **extend subscription**
  (grant days), and delete.
- **Payments** — every Cashfree transaction with status & transaction id.
- **Links** — moderate any link platform-wide (open / disable / delete).
- **Settings** — branding, plan price/name/duration, SEO, Cashfree env,
  maintenance mode, and legal content (writes to `WebsiteSettings`).
- **Audit logs** — chronological user + admin activity.

Every admin mutation is recorded in `ActivityLog` (actor = ADMIN).
Seed creates the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## 🚀 Local development

### Prerequisites
- Node.js ≥ 20
- PostgreSQL 15+
- Redis 7+ (optional locally; the app degrades gracefully without it)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   → set DATABASE_URL, NEXTAUTH_SECRET, Cashfree keys, etc.

# 3. Create the database schema
npx prisma migrate dev --name init

# 4. Seed admin + system themes (+ demo user in dev)
npm run db:seed

# 5. Run the dev server
npm run dev
```

App runs at http://localhost:3000.

Default seeded credentials (dev):
- **Admin:** value of `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- **Demo user:** `demo@trimly.app` / `Demo!2026`

### Useful scripts

| Script                     | Description                          |
| -------------------------- | ------------------------------------ |
| `npm run dev`              | Start the dev server                 |
| `npm run build`            | `prisma generate` + production build |
| `npm run typecheck`        | TypeScript check (no emit)           |
| `npm run prisma:studio`    | Open Prisma Studio                   |
| `npm run db:seed`          | Seed the database                    |

---

## 🔐 Environment variables

See [`.env.example`](./.env.example) for the full, documented list. Secrets
(Cashfree, SMTP, DB, NextAuth) are read from the environment and **never**
committed. Cashfree runs in **production mode** — drop in your production
`CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, and `CASHFREE_WEBHOOK_SECRET`.

---

## 🗺️ Build roadmap

- [x] **Phase 0** — Scaffold, design system, providers, landing page
- [x] **Phase 1** — Prisma schema (all models), client, seed
- [x] **Phase 2** — NextAuth, register/login, email verify, forgot/reset, subscription gate
- [x] **Phase 3** — Cashfree order/checkout/webhook → subscription activation
- [x] **Phase 4** — Dashboard shell, KPIs + charts, create/manage links, profile, subscription
- [x] **Phase 5** — Themed countdown redirect + per-click analytics & charts
- [x] **Phase 6** — Admin panel (auth, dashboard, users, payments, links, settings, audit)
- [ ] **Phase 7** — Admin theme ZIP upload (validate / extract / register)
- [ ] **Phase 8** — Security hardening, SEO, PWA
- [ ] **Phase 9** — Docker, Compose, Nginx, SSL, VPS deployment guide

---

_Built phase-by-phase. Each phase ships complete, non-placeholder code._
