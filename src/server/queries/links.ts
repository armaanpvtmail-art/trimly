import { prisma } from "@/lib/prisma";
import type { LinkStatus, Prisma } from "@prisma/client";

export type LinkSort = "newest" | "oldest" | "most_clicks" | "az";

export interface ListLinksParams {
  search?: string;
  status?: LinkStatus | "ALL";
  sort?: LinkSort;
  page?: number;
  perPage?: number;
}

function orderBy(sort: LinkSort): Prisma.ShortLinkOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "most_clicks":
      return { clickCount: "desc" };
    case "az":
      return { slug: "asc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export async function listUserLinks(userId: string, params: ListLinksParams = {}) {
  const { search, status = "ALL", sort = "newest", page = 1, perPage = 10 } = params;

  const where: Prisma.ShortLinkWhereInput = {
    userId,
    ...(status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { slug: { contains: search, mode: "insensitive" } },
            { destinationUrl: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.shortLink.findMany({
      where,
      orderBy: orderBy(sort),
      skip: (page - 1) * perPage,
      take: perPage,
      include: { theme: { select: { name: true, slug: true } } },
    }),
    prisma.shortLink.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getUserLink(userId: string, id: string) {
  return prisma.shortLink.findFirst({
    where: { id, userId },
    include: { theme: true },
  });
}
