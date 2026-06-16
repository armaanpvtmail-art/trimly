import type { Metadata } from "next";
import {
  CreditCard,
  IndianRupee,
  Link2,
  MousePointerClick,
  Users,
} from "lucide-react";
import {
  getAdminStats,
  getSignupSeries,
  getRecentPayments,
} from "@/server/queries/admin";
import { formatINR, formatNumber, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClicksChart } from "@/components/dashboard/clicks-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false } };

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "destructive",
};

export default async function AdminDashboard() {
  const [stats, signups, payments] = await Promise.all([
    getAdminStats(),
    getSignupSeries(30),
    getRecentPayments(8),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Platform-wide metrics at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total users" value={formatNumber(stats.totalUsers)} icon={Users} index={0} />
        <StatCard label="Active subscriptions" value={formatNumber(stats.activeSubscriptions)} icon={CreditCard} index={1} />
        <StatCard label="Revenue" value={formatINR(stats.revenue)} icon={IndianRupee} index={2} />
        <StatCard label="Total links" value={formatNumber(stats.totalLinks)} icon={Link2} index={3} />
        <StatCard label="Total clicks" value={formatNumber(stats.totalClicks)} icon={MousePointerClick} index={4} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New signups</CardTitle>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </CardHeader>
        <CardContent>
          <ClicksChart data={signups} unitOne="signup" unitMany="signups" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
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
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                    </TableCell>
                    <TableCell className="font-medium">{formatINR(Number(p.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(p.createdAt)}
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
