/** Subset of the Cashfree PG API (version 2023-08-01) we rely on. */

export interface CreateOrderInput {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customer: {
    id: string;
    email: string;
    phone: string;
    name?: string;
  };
  returnUrl: string;
  notifyUrl: string;
  orderNote?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id?: string | number;
  order_id: string;
  order_status?: string; // ACTIVE | PAID | EXPIRED | TERMINATED
  order_amount?: number;
  order_currency?: string;
  payment_session_id?: string;
  order_expiry_time?: string;
  [key: string]: unknown;
}

export interface CashfreePayment {
  cf_payment_id?: string | number;
  order_id?: string;
  payment_status?: string; // SUCCESS | FAILED | PENDING | USER_DROPPED | CANCELLED
  payment_amount?: number;
  payment_currency?: string;
  payment_time?: string;
  payment_group?: string;
  payment_method?: Record<string, unknown> | string;
  bank_reference?: string;
  [key: string]: unknown;
}

export interface CashfreeWebhookPayload {
  type?: string; // e.g. PAYMENT_SUCCESS_WEBHOOK
  event_time?: string;
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
      order_currency?: string;
    };
    payment?: CashfreePayment;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
