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
import { PasswordInput } from "@/components/ui/password-input";
import { registerUser } from "@/server/actions/auth";
import { registerSchema } from "@/lib/validations/auth";
import { passwordStrength } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-primary",
  "bg-success",
];

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const strength = passwordStrength(password);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      confirmPassword: String(form.get("confirmPassword") || ""),
    };

    const parsed = registerSchema.safeParse(values);
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
    const result = await registerUser(values);

    if (!result.ok) {
      setErrors(result.fieldErrors || {});
      if (result.message) toast.error(result.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Signing you in…");
    // Auto sign-in straight into the app.
    const res = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });
    setLoading(false);

    if (res?.error) {
      router.push("/login?registered=1");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Ada Lovelace" />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < strength ? STRENGTH_COLORS[strength] : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {STRENGTH_LABELS[strength]}
            </p>
          </div>
        )}
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link href="/legal/terms" className="underline hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
