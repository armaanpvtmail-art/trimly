import { prisma } from "@/lib/prisma";

const now = () => new Date();

export async function listAdminUsers(take = 200) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      subscriptions: {
        where: { status: "ACTIVE", expiresAt: { gt: now() } },
        orderBy: { expiresAt: "desc" },
        take: 1,
      },
      _count: { select: { links: true, payments: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    emailVerified: !!u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    linkCount: u._count.links,
    paymentCount: u._count.payments,
    subscriptionExpiresAt: u.subscriptions[0]?.expiresAt
      ? u.subscriptions[0].expiresAt.toISOString()
      : null,
  }));
}

export async function listAdminPayments(take = 200) {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { name: true, email: true } } },
  });
  return payments.map((p) => ({
    id: p.id,
    userName: p.user?.name ?? "—",
    userEmail: p.user?.email ?? "—",
    amount: Number(p.amount),
    currency: p.currency,
    status: p.status,
    method: p.method,
    cfPaymentId: p.cfPaymentId,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function listAdminLinks(take = 300) {
  const links = await prisma.shortLink.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { email: true } },
      theme: { select: { name: true } },
    },
  });
  return links.map((l) => ({
    id: l.id,
    slug: l.slug,
    destinationUrl: l.destinationUrl,
    ownerEmail: l.user?.email ?? "—",
    themeName: l.theme?.name ?? null,
    clickCount: l.clickCount,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function listAuditLogs(take = 200) {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { email: true } },
      admin: { select: { email: true } },
    },
  });
  return logs.map((l) => ({
    id: l.id,
    actorType: l.actorType,
    actor: l.admin?.email || l.user?.email || "system",
    action: l.action,
    description: l.description,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function getWebsiteSettings() {
  return prisma.websiteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}
