import { addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/env";
import { logActivity } from "@/lib/activity";

export interface RecordPaymentInput {
  orderInternalId: string;
  userId: string;
  cfPaymentId: string;
  amount: number;
  currency?: string;
  method?: string | null;
  bankReference?: string | null;
  paymentTime?: Date | null;
  raw?: Prisma.InputJsonValue;
}

export interface RecordPaymentResult {
  activated: boolean;
  duplicate?: boolean;
  subscriptionId?: string;
}

/**
 * Idempotently record a successful payment and activate / extend the user's
 * subscription. Safe against duplicate webhooks and webhook↔return races: the
 * unique `cfPaymentId` constraint guarantees a payment is processed once.
 */
export async function recordSuccessfulPayment(
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  const env = getServerEnv();
  const durationDays = env.PLAN_DURATION_DAYS;

  let result: RecordPaymentResult;
  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { cfPaymentId: input.cfPaymentId },
      });
      if (existing) {
        return {
          activated: false,
          duplicate: true,
          subscriptionId: existing.subscriptionId ?? undefined,
        };
      }

      const now = new Date();
      const active = await tx.subscription.findFirst({
        where: { userId: input.userId, status: "ACTIVE", expiresAt: { gt: now } },
        orderBy: { expiresAt: "desc" },
      });

      let subscriptionId: string;
      if (active?.expiresAt) {
        const updated = await tx.subscription.update({
          where: { id: active.id },
          data: { expiresAt: addDays(active.expiresAt, durationDays) },
        });
        subscriptionId = updated.id;
      } else {
        const created = await tx.subscription.create({
          data: {
            userId: input.userId,
            plan: "PREMIUM_MONTHLY",
            status: "ACTIVE",
            priceInr: input.amount,
            startedAt: now,
            expiresAt: addDays(now, durationDays),
          },
        });
        subscriptionId = created.id;
      }

      await tx.payment.create({
        data: {
          userId: input.userId,
          subscriptionId,
          orderId: input.orderInternalId,
          amount: input.amount,
          currency: input.currency ?? "INR",
          status: "SUCCESS",
          method: input.method ?? undefined,
          bankReference: input.bankReference ?? undefined,
          cfPaymentId: input.cfPaymentId,
          paymentTime: input.paymentTime ?? now,
          raw: input.raw,
        },
      });

      await tx.cashfreeOrder.update({
        where: { id: input.orderInternalId },
        data: { orderStatus: "PAID" },
      });

      return { activated: true, subscriptionId };
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // Concurrent duplicate (unique cfPaymentId) — already processed.
      return { activated: false, duplicate: true };
    }
    throw e;
  }

  if (result.activated) {
    await logActivity({
      actorType: "USER",
      userId: input.userId,
      action: "payment.success",
      entityType: "Payment",
      entityId: input.cfPaymentId,
      description: `Payment ${input.cfPaymentId} succeeded; subscription activated`,
      metadata: { amount: input.amount, orderId: input.orderInternalId },
    });
  }
  return result;
}

/**
 * Record a non-successful payment outcome (FAILED / CANCELLED / USER_DROPPED)
 * for auditing. Never activates a subscription. Idempotent on cfPaymentId.
 */
export async function recordFailedPayment(input: {
  orderInternalId: string;
  userId: string;
  cfPaymentId?: string | null;
  amount: number;
  status: "FAILED" | "CANCELLED" | "USER_DROPPED";
  method?: string | null;
  raw?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    if (input.cfPaymentId) {
      const existing = await prisma.payment.findUnique({
        where: { cfPaymentId: input.cfPaymentId },
      });
      if (existing) return;
    }
    await prisma.payment.create({
      data: {
        userId: input.userId,
        orderId: input.orderInternalId,
        amount: input.amount,
        currency: "INR",
        status: input.status,
        method: input.method ?? undefined,
        cfPaymentId: input.cfPaymentId ?? undefined,
        raw: input.raw,
      },
    });
    await prisma.cashfreeOrder.update({
      where: { id: input.orderInternalId },
      data: { orderStatus: input.status === "FAILED" ? "FAILED" : "ACTIVE" },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.warn("[subscription] recordFailedPayment:", (e as Error).message);
    }
  }
}

/** Normalise a Cashfree payment_status into our PaymentStatus-ish bucket. */
export function classifyCashfreeStatus(
  status?: string,
): "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" | "USER_DROPPED" {
  switch ((status || "").toUpperCase()) {
    case "SUCCESS":
      return "SUCCESS";
    case "PENDING":
      return "PENDING";
    case "USER_DROPPED":
      return "USER_DROPPED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "FAILED";
  }
}
