import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { jwtVerify } from "jose";

/**
 * Edge middleware:
 *  - User area: requires a NextAuth session (subscription gate is enforced in
 *    the dashboard server layout).
 *  - Admin area: requires a valid signed admin JWT cookie (separate auth).
 */
const USER_PROTECTED = [
  "/dashboard",
  "/create",
  "/links",
  "/analytics",
  "/themes",
  "/profile",
  "/subscription",
  "/subscribe",
];

const ADMIN_COOKIE = "trimly_admin";

function adminSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "trimly-admin-fallback-secret",
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---- Admin area ----
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    let valid = false;
    if (token) {
      try {
        await jwtVerify(token, adminSecret());
        valid = true;
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // ---- User area ----
  const isProtected = USER_PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
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
    "/admin/:path*",
  ],
};
