"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword } from "@/server/actions/profile";

export function ChangePasswordForm() {
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const formRef = React.useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      currentPassword: String(form.get("currentPassword") || ""),
      newPassword: String(form.get("newPassword") || ""),
      confirmPassword: String(form.get("confirmPassword") || ""),
    };
    start(async () => {
      const res = await changePassword(values);
      if (res.ok) {
        toast.success(res.message || "Password changed");
        formRef.current?.reset();
      } else {
        setErrors(res.fieldErrors || {});
        if (res.message && !res.fieldErrors) toast.error(res.message);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
        />
        {errors.currentPassword && (
          <p className="text-xs text-destructive">{errors.currentPassword}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
        />
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>
      <Button type="submit" variant="gradient" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
