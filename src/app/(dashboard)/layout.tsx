import { requireActiveSubscription } from "@/lib/auth/guards";
import { daysRemaining } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/**
 * Protected dashboard shell. `requireActiveSubscription()` enforces both the
 * auth gate (→ /login) and the subscription gate (→ /subscribe).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, subscription } = await requireActiveSubscription();

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, image: user.image }}
      daysRemaining={daysRemaining(subscription.expiresAt)}
    >
      {children}
    </DashboardShell>
  );
}
