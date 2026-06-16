import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { requireUser, getActiveSubscription } from "@/lib/auth/guards";
import { getPlanConfig } from "@/lib/env";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SubscribeButton } from "@/components/subscription/subscribe-button";

export const metadata: Metadata = { title: "Unlock Premium" };

const features = [
  "Unlimited short links",
  "Unlimited themes",
  "Premium analytics",
  "Fast global redirects",
  "QR codes & one-tap sharing",
  "Premium support",
];

export default async function SubscribePage() {
  const user = await requireUser();
  const active = await getActiveSubscription(user.id);
  if (active) redirect("/dashboard");

  const plan = getPlanConfig();
  const price = plan.priceInr;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-radial-fade" />
      </div>

      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton size="sm" variant="ghost" />
        </div>
      </header>

      <main className="container flex flex-col items-center py-16 text-center">
        <Badge className="mb-6 px-3 py-1">
          <Zap className="size-3.5" /> One step away from unlimited links
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
          Unlock <span className="text-gradient">unlimited URL shortening</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Hi {user.name.split(" ")[0]}, activate Premium to start creating
          themed short links with real-time analytics.
        </p>

        <div className="mt-12 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-8 text-left shadow-soft">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl" />
            <Badge className="mb-4">{plan.name}</Badge>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold tracking-tight">
                {formatINR(price)}
              </span>
              <span className="mb-1.5 text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Billed every {plan.durationDays} days. Cancel anytime.
            </p>

            <ul className="my-6 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <SubscribeButton priceLabel={`${formatINR(price)}/mo`} />
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3" /> Secured by Cashfree
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Questions?{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Learn more about Trimly
          </Link>
        </p>
      </main>
    </div>
  );
}
