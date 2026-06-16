"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "VERIFYING" | "PAID" | "PENDING" | "FAILED" | "NOT_FOUND";

const MAX_POLLS = 12;
const INTERVAL_MS = 2500;

export function PaymentResult({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<Status>("VERIFYING");
  const [message, setMessage] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    let polls = 0;

    async function poll() {
      polls += 1;
      try {
        const res = await fetch(
          `/api/payment/status?orderId=${encodeURIComponent(orderId)}`,
          { cache: "no-store" },
        );
        const data: { status: Status; message?: string } = await res.json();
        if (cancelled) return;

        if (data.status === "PAID") {
          setStatus("PAID");
          setTimeout(() => router.push("/dashboard"), 1800);
          return;
        }
        if (data.status === "FAILED" || data.status === "NOT_FOUND") {
          setStatus(data.status);
          setMessage(data.message || "");
          return;
        }
        // PENDING — keep polling up to the cap.
        setStatus("PENDING");
        if (polls < MAX_POLLS) {
          setTimeout(poll, INTERVAL_MS);
        }
      } catch {
        if (!cancelled && polls < MAX_POLLS) setTimeout(poll, INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const ui = {
    VERIFYING: {
      icon: <Loader2 className="size-12 animate-spin text-primary" />,
      title: "Confirming your payment…",
      desc: "Hang tight while we verify with Cashfree.",
    },
    PENDING: {
      icon: <Loader2 className="size-12 animate-spin text-warning" />,
      title: "Payment processing",
      desc: "Your bank is still confirming. This can take a few moments.",
    },
    PAID: {
      icon: <CheckCircle2 className="size-12 text-success" />,
      title: "Payment successful 🎉",
      desc: "Your Premium plan is active. Redirecting to your dashboard…",
    },
    FAILED: {
      icon: <XCircle className="size-12 text-destructive" />,
      title: "Payment not completed",
      desc: message || "We couldn't confirm your payment. You can try again.",
    },
    NOT_FOUND: {
      icon: <XCircle className="size-12 text-destructive" />,
      title: "Order not found",
      desc: message || "We couldn't find that order on your account.",
    },
  }[status];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <motion.div
        key={status}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        {ui.icon}
      </motion.div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{ui.title}</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">{ui.desc}</p>

      {(status === "FAILED" || status === "NOT_FOUND") && (
        <div className="mt-8 flex gap-3">
          <Button variant="gradient" asChild>
            <Link href="/subscribe">Try again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back home</Link>
          </Button>
        </div>
      )}

      {status === "PAID" && (
        <Button variant="gradient" className="mt-8" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      )}
    </div>
  );
}
