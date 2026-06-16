import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { Logo } from "@/components/brand/logo";
import { PaymentResult } from "@/components/payment/payment-result";

export const metadata: Metadata = { title: "Payment status" };
export const dynamic = "force-dynamic";

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;
  const orderId = typeof sp.order_id === "string" ? sp.order_id : "";
  if (!orderId) redirect("/subscribe");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[400px] bg-radial-fade" />
      </div>
      <header className="container flex h-16 items-center">
        <Logo />
      </header>
      <main className="container">
        <PaymentResult orderId={orderId} />
      </main>
    </div>
  );
}
