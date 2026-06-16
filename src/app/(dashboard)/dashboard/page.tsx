import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Link2,
  MousePointerClick,
  Plus,
} from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import {
  getDashboardStats,
  getClicksTimeseries,
  getRecentLinks,
  getRecentActivity,
} from "@/server/queries/dashboard";
import { formatNumber, formatDate, truncateMiddle, absoluteUrl } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClicksChart } from "@/components/dashboard/clicks-chart";
import { CopyButton } from "@/components/links/copy-button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardHome() {
  const user = await requireUser();
  const [stats, series, recentLinks, recentActivity] = await Promise.all([
    getDashboardStats(user.id),
    getClicksTimeseries(user.id, 14),
    getRecentLinks(user.id, 5),
    getRecentActivity(user.id, 6),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">Here&apos;s how your links are doing.</p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/create">
            <Plus className="size-4" /> Create link
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total links"
          value={formatNumber(stats.totalLinks)}
          icon={Link2}
          index={0}
        />
        <StatCard
          label="Total clicks"
          value={formatNumber(stats.totalClicks)}
          icon={MousePointerClick}
          index={1}
        />
        <StatCard
          label="Today's clicks"
          value={formatNumber(stats.todayClicks)}
          icon={Activity}
          index={2}
        />
        <StatCard
          label="Plan"
          value={stats.activePlan ?? "—"}
          hint={`${stats.daysRemaining} days remaining`}
          icon={CreditCard}
          index={3}
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clicks over time</CardTitle>
            <p className="text-sm text-muted-foreground">Last 14 days</p>
          </div>
          <Badge variant="secondary">
            <CalendarClock className="size-3" /> Daily
          </Badge>
        </CardHeader>
        <CardContent>
          <ClicksChart data={series} />
        </CardContent>
      </Card>

      {/* Recent links + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent links</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/links">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentLinks.length === 0 ? (
              <EmptyLinks />
            ) : (
              recentLinks.map((link) => {
                const shortUrl = absoluteUrl(`/${link.slug}`);
                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Link2 className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-medium">
                        /{link.slug}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {truncateMiddle(link.destinationUrl, 40)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatNumber(link.clickCount)}
                      </p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                    <CopyButton value={shortUrl} size="icon" variant="ghost" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.description || a.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyLinks() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Link2 className="size-6" />
      </div>
      <div>
        <p className="font-medium">No links yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first short link to see it here.
        </p>
      </div>
      <Button variant="gradient" size="sm" asChild>
        <Link href="/create">
          <Plus className="size-4" /> Create link
        </Link>
      </Button>
    </div>
  );
}
