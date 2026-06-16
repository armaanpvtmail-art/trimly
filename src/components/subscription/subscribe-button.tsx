"use client";

import * as React from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSubscriptionOrder } from "@/server/actions/payment";

/**
 * Subscribe CTA — collects a phone number (required by Cashfree), creates a
 * production order, then opens Cashfree's hosted checkout. On completion
 * Cashfree redirects to /payment/return where the payment is verified.
 */
export function SubscribeButton({ priceLabel }: { priceLabel: string }) {
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubscribe() {
    if (!/^[0-9]{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    const res = await createSubscriptionOrder(phone);

    if (!res.ok || !res.paymentSessionId || !res.mode) {
      toast.error(res.message || "Could not start checkout.");
      setLoading(false);
      return;
    }

    try {
      const cashfree = await load({ mode: res.mode });
      // Navigates this tab to Cashfree's hosted checkout, then back to
      // /payment/return?order_id=... — so we keep the button in its loading state.
      await cashfree.checkout({
        paymentSessionId: res.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch {
      toast.error("Could not open the payment window. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5 text-left">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          disabled={loading}
        />
      </div>
      <Button
        size="lg"
        variant="gradient"
        className="w-full"
        onClick={handleSubscribe}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {loading ? "Starting checkout…" : `Subscribe now · ${priceLabel}`}
      </Button>
    </div>
  );
}
