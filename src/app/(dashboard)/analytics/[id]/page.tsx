import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  Globe2,
  MousePointerClick,
  Smartphone,
  Users,
} from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getLinkAnalytics } from "@/server/queries/analytics";
import { absoluteUrl, formatNumber, truncateMiddle } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClicksChart } from "@/components/dashboard/clicks-chart";
import { BarList } from "@/components/analytics/bar-list";
import { DonutChart } from "@/components/analytics/donut-chart";
import { CopyButton } from "@/components/links/copy-button";

export const metadata: Metadata = { title: "Link analytics" };

const DEVICE_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

export default async function LinkAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getLinkAnalytics(user.id, id);
  if (!data) notFound();

  const shortUrl = absoluteUrl(`/${data.link.slug}`);
  const topCountry = data.country[0]?.label ?? "—";
  const topDevice = data.device[0]?.label ?? "—";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/links">
            <ArrowLeft className="size-4" /> Back to links
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-mono text-2xl font-bold tracking-tight">
              /{data.link.slug}
            </h1>
            <p className="truncate text-muted-foreground">
              {truncateMiddle(data.link.destinationUrl, 60)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton value={shortUrl} />
            <Button variant="outline" asChild>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Open
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clicks" value={formatNumber(data.totals.clicks)} icon={MousePointerClick} index={0} />
        <StatCard label="Unique visitors" value={formatNumber(data.totals.unique)} icon={Users} index={1} />
        <StatCard label="Top country" value={topCountry} icon={Globe2} index={2} />
        <StatCard label="Top device" value={topDevice.toLowerCase()} icon={Smartphone} index={3} />
      </div>

      {/* Timeseries */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks over time</CardTitle>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </CardHeader>
        <CardContent>
          <ClicksChart data={data.timeseries} />
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <DonutChart data={data.device} />
            </div>
            <div className="w-full space-y-2 sm:w-1/2">
              {data.device.map((d, i) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 capitalize">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }}
                    />
                    {d.label.toLowerCase()}
                  </span>
                  <span className="font-medium">{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={data.country} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={data.browser} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating systems</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={data.os} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={data.city} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={data.referrer} />
          </CardContent>
        </Card>
      </div>

      {/* Recent clicks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent clicks</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No clicks recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="hidden sm:table-cell">Browser</TableHead>
                  <TableHead className="hidden md:table-cell">Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {format(c.createdAt, "dd MMM, HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {[c.city, c.country].filter(Boolean).join(", ") || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {c.device.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {c.browser || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm text-muted-foreground">
                      {c.referrer || "Direct"}
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
