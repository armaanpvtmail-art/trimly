import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/dashboard";
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const notice = sp.registered
    ? "Account created — please sign in."
    : sp.reset
      ? "Password updated — please sign in."
      : undefined;

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Trimly account">
      <LoginForm callbackUrl={callbackUrl} initialError={error} notice={notice} />
    </AuthShell>
  );
}
