import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Link2, MousePointerClick, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getDashboardStats, getClicksTimeseries } from "@/server/queries/dashboard";
import { formatNumber, truncateMiddle } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClicksChart } from "@/components/dashboard/clicks-chart";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [stats, series, topLinks] = await Promise.all([
    getDashboardStats(user.id),
    getClicksTimeseries(user.id, 30),
    prisma.shortLink.findMany({
      where: { userId: user.id },
      orderBy: { clickCount: "desc" },
      take: 8,
      select: { id: true, slug: true, destinationUrl: true, clickCount: true, uniqueCount: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Your link performance overview. Detailed geo &amp; device breakdowns
          live on each link.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total clicks" value={formatNumber(stats.totalClicks)} icon={MousePointerClick} index={0} />
        <StatCard label="Total links" value={formatNumber(stats.totalLinks)} icon={Link2} index={1} />
        <StatCard label="Clicks today" value={formatNumber(stats.todayClicks)} icon={BarChart3} index={2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clicks over time</CardTitle>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </CardHeader>
        <CardContent>
          <ClicksChart data={series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Trophy className="size-5 text-warning" />
          <CardTitle>Top performing links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            topLinks.map((l, i) => (
              <Link
                key={l.id}
                href={`/analytics/${l.id}`}
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium">/{l.slug}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {truncateMiddle(l.destinationUrl, 48)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{formatNumber(l.uniqueCount)} unique</Badge>
                  <span className="font-semibold">{formatNumber(l.clickCount)}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
