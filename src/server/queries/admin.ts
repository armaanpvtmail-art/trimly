import { addDays, format, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  revenue: number;
  totalLinks: number;
  totalClicks: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [users, activeSubs, revenue, links, clicks] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({
      where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
    }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.shortLink.count(),
    prisma.shortLink.aggregate({ _sum: { clickCount: true } }),
  ]);

  return {
    totalUsers: users,
    activeSubscriptions: activeSubs,
    revenue: Number(revenue._sum.amount ?? 0),
    totalLinks: links,
    totalClicks: clicks._sum.clickCount ?? 0,
  };
}

export async function getRecentPayments(take = 6) {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { name: true, email: true } } },
  });
}

export interface TrendPoint {
  date: string;
  label: string;
  clicks: number;
}

/** New users per day for the last `days` days (re-uses the chart's shape). */
export async function getSignupSeries(days = 30): Promise<TrendPoint[]> {
  const since = startOfDay(subDays(new Date(), days - 1));
  const rows = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    buckets.set(format(addDays(since, i), "yyyy-MM-dd"), 0);
  }
  for (const r of rows) {
    const k = format(r.createdAt, "yyyy-MM-dd");
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, clicks]) => ({
    date,
    label: format(new Date(date), "dd MMM"),
    clicks,
  }));
}
