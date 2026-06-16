"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveSubscription } from "@/lib/auth/guards";
import { createLinkSchema, updateLinkSchema } from "@/lib/validations/link";
import {
  generateSlug,
  isValidCustomSlug,
  isReservedSlug,
  normalizeSlug,
} from "@/lib/slug";
import { cacheDel } from "@/lib/redis";
import { logActivity } from "@/lib/activity";

interface LinkActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  slug?: string;
  id?: string;
}

function fieldErrorsFrom(issues: { path: (string | number)[]; message: string }[]) {
  const fe: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path[0];
    if (typeof k === "string" && !fe[k]) fe[k] = i.message;
  }
  return fe;
}

async function uniqueRandomSlug(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const s = generateSlug();
    const exists = await prisma.shortLink.findUnique({ where: { slug: s } });
    if (!exists) return s;
  }
  return `${generateSlug()}${generateSlug().slice(0, 3)}`;
}

async function resolveTheme(themeId?: string): Promise<string | null> {
  if (!themeId) return null;
  const theme = await prisma.theme.findFirst({
    where: { id: themeId, status: "ENABLED" },
    select: { id: true },
  });
  return theme?.id ?? null;
}

export async function createLink(input: unknown): Promise<LinkActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const subscription = await getActiveSubscription(user.id);
  if (!subscription) {
    return { ok: false, message: "An active subscription is required to create links." };
  }

  const parsed = createLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const data = parsed.data;

  // Resolve slug
  let slug: string;
  if (data.customSlug) {
    slug = normalizeSlug(data.customSlug);
    if (!isValidCustomSlug(slug)) {
      return {
        ok: false,
        fieldErrors: {
          customSlug: isReservedSlug(slug)
            ? "That slug is reserved."
            : "3–40 letters, numbers, - or _.",
        },
      };
    }
    const taken = await prisma.shortLink.findUnique({ where: { slug } });
    if (taken) {
      return { ok: false, fieldErrors: { customSlug: "That slug is already taken." } };
    }
  } else {
    slug = await uniqueRandomSlug();
  }

  const themeId = await resolveTheme(data.themeId || undefined);

  const link = await prisma.shortLink.create({
    data: {
      userId: user.id,
      slug,
      destinationUrl: data.destinationUrl,
      title: data.title || null,
      themeId,
      countdownSeconds: data.countdownSeconds,
    },
  });

  await logActivity({
    actorType: "USER",
    userId: user.id,
    action: "link.create",
    entityType: "ShortLink",
    entityId: link.id,
    description: `Created /${slug}`,
  });

  revalidatePath("/links");
  revalidatePath("/dashboard");
  return { ok: true, slug: link.slug, id: link.id };
}

export async function updateLink(id: string, input: unknown): Promise<LinkActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const existing = await prisma.shortLink.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, message: "Link not found." };

  const parsed = updateLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const data = parsed.data;
  const themeId = await resolveTheme(data.themeId || undefined);

  await prisma.shortLink.update({
    where: { id },
    data: {
      destinationUrl: data.destinationUrl,
      title: data.title || null,
      themeId,
      countdownSeconds: data.countdownSeconds,
    },
  });

  await cacheDel(`link:${existing.slug}`);
  await logActivity({
    actorType: "USER",
    userId: user.id,
    action: "link.update",
    entityType: "ShortLink",
    entityId: id,
    description: `Updated /${existing.slug}`,
  });

  revalidatePath("/links");
  return { ok: true, slug: existing.slug, id };
}

export async function toggleLinkStatus(id: string): Promise<LinkActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const existing = await prisma.shortLink.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, message: "Link not found." };

  const next = existing.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
  await prisma.shortLink.update({ where: { id }, data: { status: next } });
  await cacheDel(`link:${existing.slug}`);
  await logActivity({
    actorType: "USER",
    userId: user.id,
    action: "link.toggle",
    entityType: "ShortLink",
    entityId: id,
    description: `${next === "ACTIVE" ? "Enabled" : "Disabled"} /${existing.slug}`,
  });

  revalidatePath("/links");
  revalidatePath("/dashboard");
  return { ok: true, message: next === "ACTIVE" ? "Link enabled" : "Link disabled" };
}

export async function deleteLink(id: string): Promise<LinkActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const existing = await prisma.shortLink.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, message: "Link not found." };

  await prisma.shortLink.delete({ where: { id } });
  await cacheDel(`link:${existing.slug}`);
  await logActivity({
    actorType: "USER",
    userId: user.id,
    action: "link.delete",
    entityType: "ShortLink",
    entityId: id,
    description: `Deleted /${existing.slug}`,
  });

  revalidatePath("/links");
  revalidatePath("/dashboard");
  return { ok: true, message: "Link deleted" };
}
