"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword } from "@/server/actions/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      token,
      password: String(form.get("password") || ""),
      confirmPassword: String(form.get("confirmPassword") || ""),
    };

    const parsed = resetPasswordSchema.safeParse(values);
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
    const res = await resetPassword(values);
    setLoading(false);

    if (!res.ok) {
      toast.error(res.message || "Could not reset password.");
      return;
    }
    toast.success("Password updated.");
    router.push("/login?reset=1");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
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
        Update password
      </Button>
    </form>
  );
}
