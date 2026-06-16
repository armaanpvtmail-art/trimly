import { customAlphabet } from "nanoid";

// URL-safe, unambiguous alphabet (no look-alike chars like 0/O, 1/l).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const nano = customAlphabet(ALPHABET, 7);

/** Reserved top-level paths that must never be used as a short-link slug. */
export const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "login",
  "register",
  "logout",
  "dashboard",
  "create",
  "links",
  "link",
  "analytics",
  "themes",
  "theme",
  "subscription",
  "subscribe",
  "profile",
  "settings",
  "payment",
  "verify-email",
  "forgot-password",
  "reset-password",
  "legal",
  "privacy",
  "terms",
  "about",
  "contact",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  "sw.js",
]);

const SLUG_RE = /^[a-zA-Z0-9_-]{3,40}$/;

export function generateSlug(): string {
  return nano();
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function isValidCustomSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !isReservedSlug(slug);
}

export function normalizeSlug(slug: string): string {
  return slug.trim();
}
