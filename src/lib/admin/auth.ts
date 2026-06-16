import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";
import type { Admin } from "@prisma/client";

export const ADMIN_COOKIE = "trimly_admin";
const MAX_AGE_SECONDS = 12 * 60 * 60; // 12h

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "trimly-admin-fallback-secret",
  );
}

export interface AdminClaims extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

export async function signAdminToken(claims: {
  sub: string;
  email: string;
  role: string;
  name: string;
}): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifyAdminToken(token: string): Promise<AdminClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return payload as AdminClaims;
  } catch {
    return null;
  }
}

/** Read & verify the admin session from the cookie (no DB hit). */
export async function getAdminSession(): Promise<AdminClaims | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** Set the admin cookie (call from a server action / route handler). */
export async function setAdminCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/**
 * Require an authenticated, active admin. Redirects to /admin/login otherwise.
 * Re-checks the Admin record in the DB so disabled admins are locked out.
 */
export async function requireAdmin(): Promise<Admin> {
  const session = await getAdminSession();
  if (!session?.sub) redirect("/admin/login");
  const admin = await prisma.admin.findUnique({ where: { id: session.sub } });
  if (!admin || admin.status !== "ACTIVE") redirect("/admin/login");
  return admin;
}
