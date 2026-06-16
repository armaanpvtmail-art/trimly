"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  validatePasswordResetToken,
  markPasswordResetTokenUsed,
} from "@/lib/auth/tokens";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mail";
import { logActivity } from "@/lib/activity";
import { absoluteUrl } from "@/lib/utils";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

/** Register a new user, then issue an email-verification link. */
export async function registerUser(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const normalisedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalisedEmail },
  });
  if (existing) {
    return {
      ok: false,
      fieldErrors: { email: "An account with this email already exists." },
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalisedEmail, passwordHash },
  });

  // Issue verification email (non-blocking failure).
  try {
    const token = await createEmailVerificationToken(user.id);
    await sendVerificationEmail(
      user.email,
      user.name,
      absoluteUrl(`/verify-email?token=${token}`),
    );
  } catch (err) {
    console.warn("[register] verification email failed:", (err as Error).message);
  }

  await logActivity({
    actorType: "USER",
    userId: user.id,
    action: "auth.register",
    description: `${user.email} created an account`,
    ipAddress: await clientIp(),
  });

  return { ok: true, message: "Account created. Check your inbox to verify your email." };
}

/** Always returns success to avoid leaking which emails are registered. */
export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: { email: "Enter a valid email" } };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.status === "ACTIVE") {
    try {
      const token = await createPasswordResetToken(user.id);
      await sendPasswordResetEmail(
        user.email,
        user.name,
        absoluteUrl(`/reset-password?token=${token}`),
      );
      await logActivity({
        actorType: "USER",
        userId: user.id,
        action: "auth.password_reset_requested",
        ipAddress: await clientIp(),
      });
    } catch (err) {
      console.warn("[reset] email failed:", (err as Error).message);
    }
  }

  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

/** Reset a password using a valid token. */
export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const { token, password } = parsed.data;
  const check = await validatePasswordResetToken(token);
  if (!check.ok || !check.userId) {
    return {
      ok: false,
      message:
        check.reason === "expired"
          ? "This reset link has expired. Please request a new one."
          : "This reset link is invalid.",
    };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: check.userId },
    data: { passwordHash },
  });
  await markPasswordResetTokenUsed(token);
  await logActivity({
    actorType: "USER",
    userId: check.userId,
    action: "auth.password_reset",
    ipAddress: await clientIp(),
  });

  return { ok: true, message: "Password updated. You can now sign in." };
}

/** Re-send a verification email for an as-yet-unverified account. */
export async function resendVerification(email: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (user && !user.emailVerified) {
    try {
      const token = await createEmailVerificationToken(user.id);
      await sendVerificationEmail(
        user.email,
        user.name,
        absoluteUrl(`/verify-email?token=${token}`),
      );
    } catch {
      /* ignore */
    }
  }
  return { ok: true, message: "Verification email sent if your account needs it." };
}
