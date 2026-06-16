"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logActivity } from "@/lib/activity";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validations/profile";

interface ProfileActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFrom(issues: { path: (string | number)[]; message: string }[]) {
  const fe: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path[0];
    if (typeof k === "string" && !fe[k]) fe[k] = i.message;
  }
  return fe;
}

export async function updateProfile(input: unknown): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });
  await logActivity({
    actorType: "USER",
    userId: user.id,
    action: "profile.update",
    description: "Updated profile name",
  });

  revalidatePath("/profile");
  return { ok: true, message: "Profile updated." };
}

export async function changePassword(input: unknown): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, fieldErrors: { currentPassword: "Current password is incorrect." } };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logActivity({
    actorType: "USER",
    userId: user.id,
    action: "profile.password_change",
    description: "Changed account password",
  });

  return { ok: true, message: "Password changed." };
}
