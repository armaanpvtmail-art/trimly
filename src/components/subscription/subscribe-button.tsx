"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Subscribe CTA.
 *
 * Phase 2: validates the gated flow and shows a placeholder.
 * Phase 3 replaces the click handler with a Cashfree order + hosted checkout
 * redirect. The component API stays the same so the page doesn't change.
 */
export function SubscribeButton({ priceLabel }: { priceLabel: string }) {
  const [loading, setLoading] = React.useState(false);

  async function handleSubscribe() {
    setLoading(true);
    // TODO(Phase 3): create Cashfree order and redirect to checkout.
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    toast.info("Payments go live in Phase 3 (Cashfree checkout).");
  }

  return (
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
      Subscribe now · {priceLabel}
    </Button>
  );
}
