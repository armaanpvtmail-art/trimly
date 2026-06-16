import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// ----- Email verification ---------------------------------------------------

export async function createEmailVerificationToken(
  userId: string,
): Promise<string> {
  // Invalidate any previous tokens for this user.
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function consumeEmailVerificationToken(
  token: string,
): Promise<{ ok: boolean; reason?: string }> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });
  if (!record) return { ok: false, reason: "invalid" };
  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return { ok: false, reason: "expired" };
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);
  return { ok: true };
}

// ----- Password reset -------------------------------------------------------

export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });
  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function validatePasswordResetToken(
  token: string,
): Promise<{ ok: boolean; userId?: string; reason?: string }> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (!record || record.usedAt) return { ok: false, reason: "invalid" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "expired" };
  return { ok: true, userId: record.userId };
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
