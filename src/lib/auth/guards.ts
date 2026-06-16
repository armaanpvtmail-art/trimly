import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./session";
import type { Subscription, User } from "@prisma/client";

/**
 * Require an authenticated, active user. Redirects to /login otherwise.
 * Re-checks status from the DB so suspended/deleted users with a valid JWT are
 * still kicked out.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "ACTIVE") redirect("/login?error=ACCOUNT_UNAVAILABLE");
  return user;
}

/** Return the user's current active (non-expired) subscription, or null. */
export async function getActiveSubscription(
  userId: string,
): Promise<Subscription | null> {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });
}

/**
 * Require an authenticated user WITH an active subscription.
 * Redirects unsubscribed users to the paywall.
 */
export async function requireActiveSubscription(): Promise<{
  user: User;
  subscription: Subscription;
}> {
  const user = await requireUser();
  const subscription = await getActiveSubscription(user.id);
  if (!subscription) redirect("/subscribe");
  return { user, subscription };
}

/** Convenience boolean check used by UI that branches on subscription state. */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  return (await getActiveSubscription(userId)) !== null;
}
