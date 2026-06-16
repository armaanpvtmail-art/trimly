"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requestPasswordReset } from "@/server/actions/auth";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") || "");

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    const res = await requestPasswordReset({ email });
    setLoading(false);

    if (res.ok) {
      setSent(true);
      toast.success("Check your inbox.");
    } else {
      setError(res.message || "Something went wrong.");
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <Alert variant="success">
          <MailCheck />
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>
            If an account exists for that address, we&apos;ve sent a password
            reset link. It expires in 1 hour.
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>
      <Button variant="ghost" className="w-full" asChild>
        <Link href="/login">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </Button>
    </form>
  );
}
