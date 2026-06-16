import { getServerEnv } from "@/lib/env";
import type {
  CashfreeOrderResponse,
  CashfreePayment,
  CreateOrderInput,
} from "./types";

const PRODUCTION_BASE = "https://api.cashfree.com/pg";
const SANDBOX_BASE = "https://sandbox.cashfree.com/pg";

function config() {
  const env = getServerEnv();
  return {
    appId: env.CASHFREE_APP_ID,
    secret: env.CASHFREE_SECRET_KEY,
    apiVersion: env.CASHFREE_API_VERSION,
    base: env.CASHFREE_ENV === "PRODUCTION" ? PRODUCTION_BASE : SANDBOX_BASE,
    mode: (env.CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox") as
      | "production"
      | "sandbox",
  };
}

/** Whether the Cashfree credentials are present. */
export function isCashfreeConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);
}

/** Checkout SDK mode for the browser. */
export function cashfreeMode(): "production" | "sandbox" {
  return config().mode;
}

function authHeaders() {
  const c = config();
  return {
    "Content-Type": "application/json",
    "x-api-version": c.apiVersion,
    "x-client-id": c.appId,
    "x-client-secret": c.secret,
  };
}

async function handle<T>(res: Response): Promise<T> {
  const body = await res.text();
  let json: unknown;
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    json = { raw: body };
  }
  if (!res.ok) {
    const message =
      (json as { message?: string })?.message ||
      `Cashfree request failed (${res.status})`;
    throw new CashfreeError(message, res.status, json);
  }
  return json as T;
}

export class CashfreeError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "CashfreeError";
    this.status = status;
    this.details = details;
  }
}

/** Create a Cashfree order; returns payment_session_id for checkout. */
export async function createCashfreeOrder(
  input: CreateOrderInput,
): Promise<CashfreeOrderResponse> {
  if (!isCashfreeConfigured()) {
    throw new CashfreeError("Cashfree is not configured.", 500);
  }
  const c = config();
  const res = await fetch(`${c.base}/orders`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.orderAmount,
      order_currency: input.orderCurrency,
      customer_details: {
        customer_id: input.customer.id,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        customer_name: input.customer.name,
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
      order_note: input.orderNote,
    }),
  });
  return handle<CashfreeOrderResponse>(res);
}

/** Fetch the authoritative order status from Cashfree. */
export async function getCashfreeOrder(
  orderId: string,
): Promise<CashfreeOrderResponse> {
  const c = config();
  const res = await fetch(`${c.base}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  return handle<CashfreeOrderResponse>(res);
}

/** Fetch all payment attempts for an order. */
export async function getCashfreeOrderPayments(
  orderId: string,
): Promise<CashfreePayment[]> {
  const c = config();
  const res = await fetch(
    `${c.base}/orders/${encodeURIComponent(orderId)}/payments`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
  );
  return handle<CashfreePayment[]>(res);
}
