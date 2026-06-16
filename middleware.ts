import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge middleware: authentication gate.
 *
 * - Protects the dashboard + account areas: unauthenticated users are bounced
 *   to /login with a callbackUrl.
 * - The *subscription* gate (active plan required) is enforced in the
 *   dashboard server layout via `requireActiveSubscription()`, because it needs
 *   a DB read that can't run at the edge.
 * - Admin routes have their own separate auth (see Phase 6) and are excluded
 *   here.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/create",
  "/links",
  "/analytics",
  "/themes",
  "/profile",
  "/subscription",
  "/subscribe",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create/:path*",
    "/links/:path*",
    "/analytics/:path*",
    "/themes/:path*",
    "/profile/:path*",
    "/subscription/:path*",
    "/subscribe",
  ],
};
