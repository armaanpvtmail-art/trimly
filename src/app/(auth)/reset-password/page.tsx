import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  if (!token) {
    return (
      <AuthShell title="Reset password" subtitle="Choose a new password">
        <div className="space-y-6">
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Missing reset token</AlertTitle>
            <AlertDescription>
              This link is incomplete. Please request a new password reset.
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong, unique password">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
