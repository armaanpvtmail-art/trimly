import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import { prisma } from "@/lib/prisma";
import type { DeviceType } from "@prisma/client";

const BOT_RE =
  /bot|crawl|spider|slurp|bing|google|facebookexternalhit|whatsapp|telegram|preview|monitor|curl|wget|headless|lighthouse|pingdom|uptime/i;

export function parseUserAgent(ua: string): {
  device: DeviceType;
  browser: string | null;
  os: string | null;
} {
  if (!ua) return { device: "UNKNOWN", browser: null, os: null };
  if (BOT_RE.test(ua)) return { device: "BOT", browser: null, os: null };

  const result = new UAParser(ua).getResult();
  const type = result.device.type;
  let device: DeviceType = "DESKTOP";
  if (type === "mobile") device = "MOBILE";
  else if (type === "tablet") device = "TABLET";

  return {
    device,
    browser: result.browser.name ?? null,
    os: result.os.name ?? null,
  };
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.NEXTAUTH_SECRET || "trimly-salt";
  return crypto.createHash("sha256").update(`${ip}|${salt}`).digest("hex");
}

/** Extract geo from common edge/proxy headers (Vercel, Cloudflare, Nginx). */
export function geoFromHeaders(h: Headers): {
  country: string | null;
  city: string | null;
  region: string | null;
} {
  const country =
    h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || h.get("x-geo-country") || null;
  const cityRaw =
    h.get("x-vercel-ip-city") || h.get("x-geo-city") || null;
  const region =
    h.get("x-vercel-ip-country-region") || h.get("x-geo-region") || null;
  return {
    country,
    city: cityRaw ? decodeURIComponent(cityRaw) : null,
    region,
  };
}

function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return h.get("x-real-ip") || null;
}

/**
 * Record a click for a link. Best-effort and bot/prefetch-aware.
 * Increments denormalised counters and writes a privacy-preserving analytics row.
 */
export async function recordClick(linkId: string, h: Headers): Promise<void> {
  // Ignore framework prefetches & link previews.
  if (h.get("next-router-prefetch") || h.get("purpose") === "prefetch") return;

  const ua = h.get("user-agent") || "";
  const { device, browser, os } = parseUserAgent(ua);
  if (device === "BOT") return; // don't pollute analytics with crawlers

  const ipHash = hashIp(clientIp(h));
  const { country, city, region } = geoFromHeaders(h);
  const referrer = h.get("referer");

  let isUnique = false;
  if (ipHash) {
    const prior = await prisma.linkAnalytics.findFirst({
      where: { linkId, ipHash },
      select: { id: true },
    });
    isUnique = !prior;
  }

  await prisma.$transaction([
    prisma.linkAnalytics.create({
      data: {
        linkId,
        ipHash,
        country,
        countryCode: country,
        city,
        region,
        device,
        browser,
        os,
        referrer: referrer ? referrer.slice(0, 512) : null,
        userAgent: ua ? ua.slice(0, 512) : null,
        isUnique,
      },
    }),
    prisma.shortLink.update({
      where: { id: linkId },
      data: {
        clickCount: { increment: 1 },
        ...(isUnique ? { uniqueCount: { increment: 1 } } : {}),
        lastClickedAt: new Date(),
      },
    }),
  ]);
}
