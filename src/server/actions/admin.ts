"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin/auth";
import { cacheDel } from "@/lib/redis";
import { logActivity } from "@/lib/activity";
import {
  extendSubscriptionSchema,
  websiteSettingsSchema,
} from "@/lib/validations/admin";
import type { UserStatus } from "@prisma/client";

interface AdminResult {
  ok: boolean;
  message?: string;
}

async function currentAdminId(): Promise<string | null> {
  const session = await getAdminSession();
  return session?.sub ?? null;
}

export async function setUserStatus(
  userId: string,
  status: UserStatus,
): Promise<AdminResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, message: "Unauthorized." };
  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    return { ok: false, message: "Invalid status." };
  }

  await prisma.user.update({ where: { id: userId }, data: { status } });
  await logActivity({
    actorType: "ADMIN",
    adminId,
    action: status === "SUSPENDED" ? "admin.user.suspend" : "admin.user.activate",
    entityType: "User",
    entityId: userId,
    description: `Set user ${userId} to ${status}`,
  });
  revalidatePath("/admin/users");
  return { ok: true, message: status === "SUSPENDED" ? "User suspended" : "User activated" };
}

export async function deleteUser(userId: string): Promise<AdminResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, message: "Unauthorized." };

  await prisma.user.delete({ where: { id: userId } });
  await logActivity({
    actorType: "ADMIN",
    adminId,
    action: "admin.user.delete",
    entityType: "User",
    entityId: userId,
    description: `Deleted user ${userId}`,
  });
  revalidatePath("/admin/users");
  return { ok: true, message: "User deleted" };
}

export async function extendUserSubscription(input: unknown): Promise<AdminResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, message: "Unauthorized." };

  const parsed = extendSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter 1–365 days." };
  const { userId, days } = parsed.data;

  const now = new Date();
  const active = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", expiresAt: { gt: now } },
    orderBy: { expiresAt: "desc" },
  });

  if (active?.expiresAt) {
    await prisma.subscription.update({
      where: { id: active.id },
      data: { expiresAt: addDays(active.expiresAt, days) },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        plan: "PREMIUM_MONTHLY",
        status: "ACTIVE",
        priceInr: 0,
        startedAt: now,
        expiresAt: addDays(now, days),
      },
    });
  }

  await logActivity({
    actorType: "ADMIN",
    adminId,
    action: "admin.subscription.extend",
    entityType: "User",
    entityId: userId,
    description: `Extended subscription for ${userId} by ${days} days`,
  });
  revalidatePath("/admin/users");
  return { ok: true, message: `Subscription extended by ${days} days` };
}

export async function adminToggleLink(linkId: string): Promise<AdminResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, message: "Unauthorized." };

  const link = await prisma.shortLink.findUnique({ where: { id: linkId } });
  if (!link) return { ok: false, message: "Link not found." };

  const next = link.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  await prisma.shortLink.update({ where: { id: linkId }, data: { status: next } });
  await cacheDel(`link:${link.slug}`);
  await logActivity({
    actorType: "ADMIN",
    adminId,
    action: "admin.link.toggle",
    entityType: "ShortLink",
    entityId: linkId,
    description: `${next === "ACTIVE" ? "Enabled" : "Disabled"} /${link.slug}`,
  });
  revalidatePath("/admin/links");
  return { ok: true, message: next === "ACTIVE" ? "Link enabled" : "Link disabled" };
}

export async function adminDeleteLink(linkId: string): Promise<AdminResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, message: "Unauthorized." };

  const link = await prisma.shortLink.findUnique({ where: { id: linkId } });
  if (!link) return { ok: false, message: "Link not found." };

  await prisma.shortLink.delete({ where: { id: linkId } });
  await cacheDel(`link:${link.slug}`);
  await logActivity({
    actorType: "ADMIN",
    adminId,
    action: "admin.link.delete",
    entityType: "ShortLink",
    entityId: linkId,
    description: `Deleted /${link.slug}`,
  });
  revalidatePath("/admin/links");
  return { ok: true, message: "Link deleted" };
}

export async function updateWebsiteSettings(input: unknown): Promise<AdminResult> {
  const adminId = await currentAdminId();
  if (!adminId) return { ok: false, message: "Unauthorized." };

  const parsed = websiteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Some settings are invalid." };
  }

  await prisma.websiteSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  await logActivity({
    actorType: "ADMIN",
    adminId,
    action: "admin.settings.update",
    description: "Updated website settings",
  });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved" };
}
