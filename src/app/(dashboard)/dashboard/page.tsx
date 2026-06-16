import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireUser, getActiveSubscription } from "@/lib/auth/guards";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { daysRemaining, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const subscription = await getActiveSubscription(user.id);

  return (
    <div className="container py-8">
      <header className="mb-10 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton size="sm" />
        </div>
      </header>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your account is active. The full dashboard experience arrives in
          Phase 4.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscription
            </CardTitle>
            <Badge variant="success">
              <CheckCircle2 className="size-3" /> Active
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Premium Monthly</p>
            {subscription?.expiresAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                {daysRemaining(subscription.expiresAt)} days remaining · renews{" "}
                {formatDate(subscription.expiresAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-lg font-semibold">{user.email}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.emailVerified ? "Verified" : "Not verified yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Member since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatDate(user.createdAt)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
