import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { consumeEmailVerificationToken } from "@/lib/auth/tokens";

export const metadata: Metadata = { title: "Verify email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  let state: "ok" | "expired" | "invalid" | "missing" = "missing";
  if (token) {
    const result = await consumeEmailVerificationToken(token);
    state = result.ok
      ? "ok"
      : result.reason === "expired"
        ? "expired"
        : "invalid";
  }

  const content = {
    ok: {
      variant: "success" as const,
      icon: <CheckCircle2 />,
      title: "Email verified 🎉",
      desc: "Your email address has been confirmed. You're all set.",
    },
    expired: {
      variant: "warning" as const,
      icon: <Clock />,
      title: "Link expired",
      desc: "This verification link has expired. Sign in to request a new one.",
    },
    invalid: {
      variant: "destructive" as const,
      icon: <XCircle />,
      title: "Invalid link",
      desc: "This verification link is invalid or has already been used.",
    },
    missing: {
      variant: "destructive" as const,
      icon: <XCircle />,
      title: "Missing token",
      desc: "No verification token was provided.",
    },
  }[state];

  return (
    <AuthShell title="Email verification" subtitle="Confirming your account">
      <div className="space-y-6">
        <Alert variant={content.variant}>
          {content.icon}
          <AlertTitle>{content.title}</AlertTitle>
          <AlertDescription>{content.desc}</AlertDescription>
        </Alert>
        <Button variant="gradient" className="w-full" asChild>
          <Link href={state === "ok" ? "/dashboard" : "/login"}>
            {state === "ok" ? "Go to dashboard" : "Back to sign in"}
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
