import { addDays, format, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { daysRemaining } from "@/lib/utils";

export interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  todayClicks: number;
  activePlan: string | null;
  daysRemaining: number;
  expiresAt: Date | null;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const startToday = startOfDay(new Date());

  const [linkAgg, todayClicks, subscription] = await Promise.all([
    prisma.shortLink.aggregate({
      where: { userId },
      _sum: { clickCount: true },
      _count: true,
    }),
    prisma.linkAnalytics.count({
      where: { link: { userId }, createdAt: { gte: startToday } },
    }),
    prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "desc" },
    }),
  ]);

  return {
    totalLinks: linkAgg._count,
    totalClicks: linkAgg._sum.clickCount ?? 0,
    todayClicks,
    activePlan: subscription ? "Premium Monthly" : null,
    daysRemaining: daysRemaining(subscription?.expiresAt),
    expiresAt: subscription?.expiresAt ?? null,
  };
}

export interface TimeseriesPoint {
  date: string;
  label: string;
  clicks: number;
}

/** Daily click counts for the last `days` days (zero-filled). */
export async function getClicksTimeseries(
  userId: string,
  days = 14,
): Promise<TimeseriesPoint[]> {
  const since = startOfDay(subDays(new Date(), days - 1));
  const rows = await prisma.linkAnalytics.findMany({
    where: { link: { userId }, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    buckets.set(format(addDays(since, i), "yyyy-MM-dd"), 0);
  }
  for (const r of rows) {
    const key = format(r.createdAt, "yyyy-MM-dd");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, clicks]) => ({
    date,
    label: format(new Date(date), "dd MMM"),
    clicks,
  }));
}

export async function getRecentLinks(userId: string, take = 5) {
  return prisma.shortLink.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: { theme: { select: { name: true, slug: true } } },
  });
}

export async function getRecentActivity(userId: string, take = 6) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
