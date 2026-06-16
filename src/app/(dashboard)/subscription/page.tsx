import type { Metadata } from "next";
import { CheckCircle2, CreditCard } from "lucide-react";
import { requireUser, getActiveSubscription } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getPlanConfig } from "@/lib/env";
import { formatINR, formatDate, daysRemaining } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubscribeButton } from "@/components/subscription/subscribe-button";

export const metadata: Metadata = { title: "Subscription" };

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "secondary",
  CANCELLED: "secondary",
  USER_DROPPED: "secondary",
};

export default async function SubscriptionPage() {
  const user = await requireUser();
  const plan = getPlanConfig();
  const [subscription, payments] = await Promise.all([
    getActiveSubscription(user.id),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const remaining = daysRemaining(subscription?.expiresAt);
  const pct = Math.round((remaining / plan.durationDays) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">Manage your plan and billing history.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{plan.name}</h2>
              {subscription ? (
                <Badge variant="success">
                  <CheckCircle2 className="size-3" /> Active
                </Badge>
              ) : (
                <Badge variant="warning">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatINR(plan.priceInr)} every {plan.durationDays} days
            </p>
          </div>
          <div className="w-full sm:w-64">
            <SubscribeButton priceLabel={`${formatINR(plan.priceInr)}/mo`} />
          </div>
        </div>

        {subscription && (
          <div className="border-t bg-muted/30 p-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current cycle</span>
              <span className="font-medium">{remaining} days remaining</span>
            </div>
            <Progress value={Math.min(100, Math.max(0, pct))} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="font-medium">
                  {subscription.startedAt ? formatDate(subscription.startedAt) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="font-medium">
                  {subscription.expiresAt ? formatDate(subscription.expiresAt) : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payments yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {formatINR(Number(p.amount))}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {p.method || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
