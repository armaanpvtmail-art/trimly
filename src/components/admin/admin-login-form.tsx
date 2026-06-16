"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { adminLogin } from "@/server/actions/admin-auth";

export function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
    };
    setLoading(true);
    const res = await adminLogin(values);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.message || "Login failed");
      return;
    }
    toast.success("Welcome, admin");
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Admin email</Label>
        <Input id="email" name="email" type="email" placeholder="admin@trimly.app" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </div>
      <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign in to admin
      </Button>
    </form>
  );
}
