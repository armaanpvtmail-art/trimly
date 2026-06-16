import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/env";
import { verifyCashfreeSignature } from "@/lib/cashfree/signature";
import {
  recordSuccessfulPayment,
  recordFailedPayment,
  classifyCashfreeStatus,
} from "@/lib/subscription";
import { logActivity } from "@/lib/activity";
import type { CashfreeWebhookPayload } from "@/lib/cashfree/types";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const env = getServerEnv();
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") || "";
  const timestamp = req.headers.get("x-webhook-timestamp") || "";

  // 1) Verify signature — reject anything we can't authenticate.
  const valid = verifyCashfreeSignature({
    timestamp,
    rawBody,
    signature,
    secret: env.CASHFREE_WEBHOOK_SECRET,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2) Parse.
  let payload: CashfreeWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = payload.data?.order?.order_id;
  const payment = payload.data?.payment;
  const type = payload.type || "";

  if (!orderId) {
    // Could be a test ping — acknowledge so Cashfree marks the endpoint healthy.
    return NextResponse.json({ received: true });
  }

  // 3) Resolve our order.
  const order = await prisma.cashfreeOrder.findUnique({ where: { orderId } });
  if (!order) {
    // Unknown order — acknowledge to stop retries; nothing to do.
    return NextResponse.json({ received: true, note: "unknown order" });
  }

  await logActivity({
    actorType: "SYSTEM",
    userId: order.userId,
    action: "payment.webhook",
    entityType: "CashfreeOrder",
    entityId: orderId,
    description: `Webhook ${type} for ${orderId}`,
    metadata: { type } as Prisma.InputJsonValue,
  });

  const cfPaymentId = payment?.cf_payment_id
    ? String(payment.cf_payment_id)
    : undefined;
  const status = classifyCashfreeStatus(payment?.payment_status);
  const amount = payment?.payment_amount
    ? Number(payment.payment_amount)
    : Number(order.orderAmount);

  try {
    if (type.includes("PAYMENT_SUCCESS") || status === "SUCCESS") {
      await recordSuccessfulPayment({
        orderInternalId: order.id,
        userId: order.userId,
        cfPaymentId: cfPaymentId || `order_${orderId}`,
        amount,
        currency: order.orderCurrency,
        method:
          typeof payment?.payment_group === "string"
            ? payment.payment_group
            : undefined,
        bankReference: payment?.bank_reference ?? undefined,
        paymentTime: payment?.payment_time
          ? new Date(payment.payment_time)
          : undefined,
        raw: payload as unknown as Prisma.InputJsonValue,
      });
    } else if (
      type.includes("PAYMENT_FAILED") ||
      type.includes("USER_DROPPED") ||
      status === "FAILED" ||
      status === "USER_DROPPED" ||
      status === "CANCELLED"
    ) {
      await recordFailedPayment({
        orderInternalId: order.id,
        userId: order.userId,
        cfPaymentId,
        amount,
        status: status === "SUCCESS" || status === "PENDING" ? "FAILED" : status,
        method:
          typeof payment?.payment_group === "string"
            ? payment.payment_group
            : undefined,
        raw: payload as unknown as Prisma.InputJsonValue,
      });
    }
    // PENDING and other events are acknowledged without state change.
  } catch (err) {
    // Log but still 200 so Cashfree doesn't hammer retries; reconciliation can
    // happen via the verify endpoint.
    console.error("[cashfree webhook] processing error:", (err as Error).message);
  }

  return NextResponse.json({ received: true });
}
