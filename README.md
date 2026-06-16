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
- [ ] **Phase 3** — Cashfree order/checkout/webhook → subscription activation
- [ ] **Phase 4** — User dashboard, create link, my links, profile, subscription
- [ ] **Phase 5** — Themed countdown redirect + analytics capture & charts
- [ ] **Phase 6** — Admin panel (users, payments, links, settings, audit)
- [ ] **Phase 7** — Admin theme ZIP upload (validate / extract / register)
- [ ] **Phase 8** — Security hardening, SEO, PWA
- [ ] **Phase 9** — Docker, Compose, Nginx, SSL, VPS deployment guide

---

_Built phase-by-phase. Each phase ships complete, non-placeholder code._
