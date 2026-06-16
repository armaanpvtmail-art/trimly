"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  signAdminToken,
  setAdminCookie,
  clearAdminCookie,
  getAdminSession,
} from "@/lib/admin/auth";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface AdminAuthResult {
  ok: boolean;
  message?: string;
}

export async function adminLogin(input: unknown): Promise<AdminAuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email and password." };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || admin.status !== "ACTIVE") {
    return { ok: false, message: "Invalid credentials." };
  }
  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) return { ok: false, message: "Invalid credentials." };

  const token = await signAdminToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name,
  });
  await setAdminCookie(token);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await logActivity({
    actorType: "ADMIN",
    adminId: admin.id,
    action: "admin.login",
    description: `${admin.email} signed in to admin`,
    ipAddress: (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  const session = await getAdminSession();
  if (session?.sub) {
    await logActivity({
      actorType: "ADMIN",
      adminId: session.sub,
      action: "admin.logout",
    });
  }
  await clearAdminCookie();
}
