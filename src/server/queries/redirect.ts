import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/redis";
import type { LinkStatus } from "@prisma/client";

export interface ResolvedTheme {
  name: string;
  config: unknown;
  backgroundImage: string | null;
  backgroundVideo: string | null;
  logo: string | null;
  countdownDefault: number;
}

export interface ResolvedLink {
  id: string;
  slug: string;
  destinationUrl: string;
  status: LinkStatus;
  countdownSeconds: number;
  expiresAt: string | null;
  theme: ResolvedTheme | null;
}

const TTL_SECONDS = 120;

/** Resolve a slug to its link (Redis-cached). Cache is invalidated on edits. */
export async function resolveLink(slug: string): Promise<ResolvedLink | null> {
  const key = `link:${slug}`;
  const cached = await cacheGet<ResolvedLink>(key);
  if (cached) return cached;

  const link = await prisma.shortLink.findUnique({
    where: { slug },
    include: {
      theme: {
        select: {
          name: true,
          config: true,
          backgroundImage: true,
          backgroundVideo: true,
          logo: true,
          countdownDefault: true,
        },
      },
    },
  });
  if (!link) return null;

  const resolved: ResolvedLink = {
    id: link.id,
    slug: link.slug,
    destinationUrl: link.destinationUrl,
    status: link.status,
    countdownSeconds: link.countdownSeconds,
    expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
    theme: link.theme
      ? {
          name: link.theme.name,
          config: link.theme.config,
          backgroundImage: link.theme.backgroundImage,
          backgroundVideo: link.theme.backgroundVideo,
          logo: link.theme.logo,
          countdownDefault: link.theme.countdownDefault,
        }
      : null,
  };

  await cacheSet(key, resolved, TTL_SECONDS);
  return resolved;
}
