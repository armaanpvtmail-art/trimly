import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySubscriptionOrder } from "@/server/actions/payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 400 });
  }
  const result = await verifySubscriptionOrder(orderId);
  return NextResponse.json(result, { status: 200 });
}
