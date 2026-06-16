import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Gauge,
  Palette,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SplashScreen } from "@/components/brand/splash-screen";
import { formatINR } from "@/lib/utils";
import { getServerEnv } from "@/lib/env";

const features = [
  {
    icon: Palette,
    title: "Themed redirects",
    desc: "Every link can open a beautiful branded interstitial with a countdown before redirecting.",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    desc: "Track clicks, unique visitors, geography, device, browser and OS — visualised with rich charts.",
  },
  {
    icon: Zap,
    title: "Lightning redirects",
    desc: "Edge-cached lookups via Redis keep your short links resolving in milliseconds.",
  },
  {
    icon: Gauge,
    title: "Unlimited links",
    desc: "Create as many short links and custom slugs as you need — no caps for subscribers.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    desc: "Rate limiting, CSRF protection, hashed passwords and audit logs baked in.",
  },
  {
    icon: Sparkles,
    title: "Premium experience",
    desc: "A dashboard crafted with the polish of Linear, Vercel and Stripe.",
  },
];

const planFeatures = [
  "Unlimited short links",
  "Unlimited themes",
  "Premium analytics",
  "Fast global redirects",
  "QR codes & sharing",
  "Premium support",
];

export default function LandingPage() {
  const env = getServerEnv();
  const price = env.PLAN_PRICE_INR;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SplashScreen />

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-radial-fade" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link href="/register">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center pt-24 pb-20 text-center">
        <Badge variant="default" className="mb-6 px-3 py-1">
          <Sparkles className="size-3.5" /> Now with custom themed redirects
        </Badge>
        <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Long links, made <span className="text-gradient">beautifully short</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Trimly is the premium URL shortener for creators and teams. Branded
          themes, deep analytics and blazing-fast redirects — all in one
          gorgeous dashboard.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="gradient" asChild>
            <Link href="/register">
              Start for {formatINR(price)}/mo <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#features">See features</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card tricks · Cancel anytime · Made for India 🇮🇳
        </p>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to ship links
          </h2>
          <p className="mt-3 text-muted-foreground">
            A complete toolkit for shortening, theming, and measuring your links.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-premium group p-6 hover:-translate-y-1"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:scale-110">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-20">
        <div className="mx-auto max-w-md">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-soft">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl" />
            <Badge className="mb-4">Premium Monthly</Badge>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold tracking-tight">
                {formatINR(price)}
              </span>
              <span className="mb-1.5 text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Unlock the full Trimly experience. Renewed every {env.PLAN_DURATION_DAYS} days.
            </p>
            <ul className="mt-6 space-y-3">
              {planFeatures.map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-sm">
                  <span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
            <Button size="lg" variant="gradient" className="mt-8 w-full" asChild>
              <Link href="/register">Subscribe now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {env.PLAN_CURRENCY === "INR" ? "Trimly" : "Trimly"}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
