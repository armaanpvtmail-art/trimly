import { addDays, format, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export interface BreakdownItem {
  label: string;
  value: number;
}

function mapGroup(
  rows: { _count: { _all: number } }[],
  key: string,
  fallback: string,
): BreakdownItem[] {
  return rows
    .map((r) => ({
      label: ((r as Record<string, unknown>)[key] as string | null) || fallback,
      value: r._count._all,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export async function getLinkAnalytics(userId: string, linkId: string) {
  const link = await prisma.shortLink.findFirst({
    where: { id: linkId, userId },
    include: { theme: { select: { name: true } } },
  });
  if (!link) return null;

  const since = startOfDay(subDays(new Date(), 29));

  const [events, byCountry, byCity, byDevice, byBrowser, byOs, byReferrer, recent] =
    await Promise.all([
      prisma.linkAnalytics.findMany({
        where: { linkId, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.linkAnalytics.groupBy({ by: ["country"], where: { linkId }, _count: { _all: true } }),
      prisma.linkAnalytics.groupBy({ by: ["city"], where: { linkId }, _count: { _all: true } }),
      prisma.linkAnalytics.groupBy({ by: ["device"], where: { linkId }, _count: { _all: true } }),
      prisma.linkAnalytics.groupBy({ by: ["browser"], where: { linkId }, _count: { _all: true } }),
      prisma.linkAnalytics.groupBy({ by: ["os"], where: { linkId }, _count: { _all: true } }),
      prisma.linkAnalytics.groupBy({ by: ["referrer"], where: { linkId }, _count: { _all: true } }),
      prisma.linkAnalytics.findMany({
        where: { linkId },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

  // Build a zero-filled 30-day timeseries.
  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    buckets.set(format(addDays(since, i), "yyyy-MM-dd"), 0);
  }
  for (const e of events) {
    const k = format(e.createdAt, "yyyy-MM-dd");
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + 1);
  }
  const timeseries = Array.from(buckets.entries()).map(([date, clicks]) => ({
    date,
    label: format(new Date(date), "dd MMM"),
    clicks,
  }));

  return {
    link,
    totals: { clicks: link.clickCount, unique: link.uniqueCount },
    timeseries,
    country: mapGroup(byCountry, "country", "Unknown"),
    city: mapGroup(byCity, "city", "Unknown"),
    device: mapGroup(byDevice, "device", "UNKNOWN"),
    browser: mapGroup(byBrowser, "browser", "Unknown"),
    os: mapGroup(byOs, "os", "Unknown"),
    referrer: mapGroup(byReferrer, "referrer", "Direct"),
    recent,
  };
}
