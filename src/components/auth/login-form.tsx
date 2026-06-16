"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema } from "@/lib/validations/auth";

function mapError(code: string): string {
  if (code.includes("SUSPENDED")) return "Your account has been suspended.";
  if (code.includes("UNAVAILABLE")) return "This account is no longer available.";
  return "Invalid email or password.";
}

export function LoginForm({
  callbackUrl = "/dashboard",
  initialError,
  notice,
}: {
  callbackUrl?: string;
  initialError?: string;
  notice?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (initialError) toast.error(mapError(initialError));
    if (notice) toast.success(notice);
  }, [initialError, notice]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      remember: form.get("remember") === "on",
    };

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const k = i.path[0];
        if (typeof k === "string" && !fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
      callbackUrl,
    });
    setLoading(false);

    if (res?.error) {
      toast.error(mapError(res.error));
      return;
    }
    toast.success("Welcome back!");
    router.push(callbackUrl);
    router.refresh();
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
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox name="remember" defaultChecked /> Keep me signed in
      </label>

      <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
