import { requireActiveSubscription } from "@/lib/auth/guards";

/**
 * Protected dashboard shell.
 *
 * The subscription gate lives here: `requireActiveSubscription()` redirects
 * unauthenticated users to /login and unsubscribed users to /subscribe.
 * (The full sidebar + navigation chrome is added in Phase 4.)
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireActiveSubscription();
  return <div className="min-h-screen bg-background">{children}</div>;
}
