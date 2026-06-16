import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAdminSession } from "@/lib/admin/auth";
import { LogoMark } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute inset-x-0 top-0 h-[400px] bg-radial-fade" />
      </div>
      <Card className="relative w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark className="size-12" />
          <h1 className="mt-4 flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="size-5 text-primary" /> Admin Console
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Restricted access — authorised staff only.
          </p>
        </div>
        <AdminLoginForm />
      </Card>
    </div>
  );
}
