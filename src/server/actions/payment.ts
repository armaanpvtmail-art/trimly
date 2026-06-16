"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/utils";
import { getPlanConfig } from "@/lib/env";
import { logActivity } from "@/lib/activity";
import {
  createCashfreeOrder,
  getCashfreeOrder,
  getCashfreeOrderPayments,
  cashfreeMode,
  isCashfreeConfigured,
  CashfreeError,
} from "@/lib/cashfree/client";
import {
  recordSuccessfulPayment,
  recordFailedPayment,
  classifyCashfreeStatus,
} from "@/lib/subscription";
import type { Prisma } from "@prisma/client";

const PHONE_RE = /^[0-9]{10}$/;

interface CreateOrderResult {
  ok: boolean;
  message?: string;
  orderId?: string;
  paymentSessionId?: string;
  mode?: "production" | "sandbox";
}

/** Create a Cashfree order for the ₹90 plan and return a checkout session. */
export async function createSubscriptionOrder(
  phone: string,
): Promise<CreateOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to continue." };
  if (user.status !== "ACTIVE") {
    return { ok: false, message: "Your account is not active." };
  }
  if (!PHONE_RE.test(phone)) {
    return { ok: false, message: "Enter a valid 10-digit mobile number." };
  }
  if (!isCashfreeConfigured()) {
    return {
      ok: false,
      message:
        "Payments aren't configured yet. Add your Cashfree keys to the environment.",
    };
  }

  const plan = getPlanConfig();
  const orderId = `trimly_${Date.now()}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const returnUrl = absoluteUrl(`/payment/return?order_id={order_id}`);
  const notifyUrl = absoluteUrl(`/api/webhooks/cashfree`);

  // Persist our order first so webhooks can resolve it even before the API
  // round-trip finishes.
  const order = await prisma.cashfreeOrder.create({
    data: {
      userId: user.id,
      orderId,
      orderAmount: plan.priceInr,
      orderCurrency: plan.currency,
      orderStatus: "CREATED",
      customerId: user.id,
      customerEmail: user.email,
      customerPhone: phone,
      returnUrl,
      notifyUrl,
      orderNote: `${plan.name} subscription`,
    },
  });

  try {
    const cf = await createCashfreeOrder({
      orderId,
      orderAmount: plan.priceInr,
      orderCurrency: plan.currency,
      customer: {
        id: user.id,
        email: user.email,
        phone,
        name: user.name,
      },
      returnUrl,
      notifyUrl,
      orderNote: `${plan.name} subscription`,
    });

    await prisma.cashfreeOrder.update({
      where: { id: order.id },
      data: {
        cfOrderId: cf.cf_order_id ? String(cf.cf_order_id) : undefined,
        paymentSessionId: cf.payment_session_id,
        orderStatus: "ACTIVE",
        raw: cf as unknown as Prisma.InputJsonValue,
      },
    });

    await logActivity({
      actorType: "USER",
      userId: user.id,
      action: "payment.order_created",
      entityType: "CashfreeOrder",
      entityId: orderId,
      description: `Created order ${orderId} for ${plan.currency} ${plan.priceInr}`,
      ipAddress: (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    if (!cf.payment_session_id) {
      return { ok: false, message: "Could not start checkout. Try again." };
    }

    return {
      ok: true,
      orderId,
      paymentSessionId: cf.payment_session_id,
      mode: cashfreeMode(),
    };
  } catch (err) {
    await prisma.cashfreeOrder.update({
      where: { id: order.id },
      data: { orderStatus: "FAILED" },
    });
    const message =
      err instanceof CashfreeError
        ? err.message
        : "Could not create the payment order. Please try again.";
    return { ok: false, message };
  }
}

interface VerifyResult {
  status: "PAID" | "PENDING" | "FAILED" | "NOT_FOUND";
  message?: string;
}

/**
 * Authoritatively verify an order against Cashfree and sync our DB.
 * Used by the return page poller. Never trusts client-side redirect params.
 */
export async function verifySubscriptionOrder(
  orderId: string,
): Promise<VerifyResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "NOT_FOUND", message: "Not signed in." };

  const order = await prisma.cashfreeOrder.findUnique({ where: { orderId } });
  if (!order || order.userId !== user.id) {
    return { status: "NOT_FOUND", message: "Order not found." };
  }

  let cfOrder;
  let payments;
  try {
    [cfOrder, payments] = await Promise.all([
      getCashfreeOrder(orderId),
      getCashfreeOrderPayments(orderId),
    ]);
  } catch {
    return { status: "PENDING", message: "Still confirming with the bank…" };
  }

  const success = payments.find(
    (p) => classifyCashfreeStatus(p.payment_status) === "SUCCESS",
  );

  if (cfOrder.order_status === "PAID" || success) {
    const pay = success ?? payments[0];
    const cfPaymentId = pay?.cf_payment_id
      ? String(pay.cf_payment_id)
      : `order_${orderId}`;
    await recordSuccessfulPayment({
      orderInternalId: order.id,
      userId: user.id,
      cfPaymentId,
      amount: Number(order.orderAmount),
      currency: order.orderCurrency,
      method:
        typeof pay?.payment_group === "string" ? pay.payment_group : undefined,
      bankReference: pay?.bank_reference ?? undefined,
      paymentTime: pay?.payment_time ? new Date(pay.payment_time) : undefined,
      raw: { order: cfOrder, payment: pay } as unknown as Prisma.InputJsonValue,
    });
    return { status: "PAID" };
  }

  const pending = payments.some(
    (p) => classifyCashfreeStatus(p.payment_status) === "PENDING",
  );
  if (pending || cfOrder.order_status === "ACTIVE") {
    return { status: "PENDING" };
  }

  const failed = payments.find((p) => {
    const s = classifyCashfreeStatus(p.payment_status);
    return s === "FAILED" || s === "USER_DROPPED" || s === "CANCELLED";
  });
  if (failed) {
    await recordFailedPayment({
      orderInternalId: order.id,
      userId: user.id,
      cfPaymentId: failed.cf_payment_id ? String(failed.cf_payment_id) : undefined,
      amount: Number(order.orderAmount),
      status: classifyCashfreeStatus(failed.payment_status) as
        | "FAILED"
        | "CANCELLED"
        | "USER_DROPPED",
      raw: failed as unknown as Prisma.InputJsonValue,
    });
  }
  return { status: "FAILED", message: "Payment was not completed." };
}
