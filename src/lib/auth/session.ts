import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/** Get the current NextAuth session (server-side). */
export function auth() {
  return getServerSession(authOptions);
}

/** Resolve the full User record for the current session, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
