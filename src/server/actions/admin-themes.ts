"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin/auth";
import { logActivity } from "@/lib/activity";
import { processThemeZip, ThemeValidationError } from "@/lib/themes/process";
import { writeThemeFiles, deleteThemeFolder, themePublicBase } from "@/lib/themes/storage";
import { uniqueThemeSlug } from "@/lib/themes/slug";
import { updateThemeMetaSchema } from "@/lib/validations/theme";
import type { Prisma, ThemeStatus } from "@prisma/client";

interface ThemeResult {
  ok: boolean;
  message?: string;
  slug?: string;
}

async function adminId(): Promise<string | null> {
  return (await getAdminSession())?.sub ?? null;
}

export async function uploadTheme(formData: FormData): Promise<ThemeResult> {
  const admin = await adminId();
  if (!admin) return { ok: false, message: "Unauthorized." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, message: "No file provided." };

  const maxMb = Number(process.env.MAX_THEME_ZIP_MB || 20);
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, message: `ZIP exceeds the ${maxMb}MB limit.` };
  }
  if (!/\.zip$/i.test(file.name)) {
    return { ok: false, message: "Please upload a .zip file." };
  }

  let processed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    processed = processThemeZip(buffer);
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof ThemeValidationError ? err.message : "Could not process the ZIP.",
    };
  }

  const slug = await uniqueThemeSlug(processed.meta.name);
  const publicBase = themePublicBase(slug);

  let written;
  try {
    written = await writeThemeFiles(slug, processed.files);
  } catch {
    await deleteThemeFolder(slug);
    return { ok: false, message: "Failed to save theme files." };
  }

  const urlFor = (rel?: string | null) =>
    rel && processed.files.some((f) => f.relPath === rel) ? `${publicBase}/${rel}` : null;

  try {
    const theme = await prisma.theme.create({
      data: {
        name: processed.meta.name,
        slug,
        description: processed.meta.description,
        version: processed.meta.version,
        status: "ENABLED",
        isSystem: false,
        config: processed.meta as unknown as Prisma.InputJsonValue,
        entryHtml: processed.entryHtmlRel,
        folderPath: written.folderPath,
        previewImage: processed.previewRel ? `${publicBase}/${processed.previewRel}` : null,
        backgroundImage: urlFor(processed.meta.background?.image),
        backgroundVideo: urlFor(processed.meta.background?.video),
        logo: urlFor(processed.meta.logo),
        countdownDefault: processed.meta.countdownDefault ?? 5,
        uploadedById: admin,
        assets: {
          create: written.assets.map((a) => ({
            type: a.type,
            fileName: path.basename(a.relPath),
            filePath: a.relPath,
            url: a.url,
            mimeType: a.mime,
            sizeBytes: a.size,
          })),
        },
      },
    });

    await logActivity({
      actorType: "ADMIN",
      adminId: admin,
      action: "admin.theme.upload",
      entityType: "Theme",
      entityId: theme.id,
      description: `Uploaded theme "${theme.name}" (${written.assets.length} files)`,
    });
  } catch {
    await deleteThemeFolder(slug);
    return { ok: false, message: "Failed to register the theme." };
  }

  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  return { ok: true, slug };
}

export async function setThemeStatus(id: string, status: ThemeStatus): Promise<ThemeResult> {
  const admin = await adminId();
  if (!admin) return { ok: false, message: "Unauthorized." };

  await prisma.theme.update({ where: { id }, data: { status } });
  await logActivity({
    actorType: "ADMIN",
    adminId: admin,
    action: "admin.theme.status",
    entityType: "Theme",
    entityId: id,
    description: `Set theme ${id} to ${status}`,
  });
  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  return { ok: true, message: status === "ENABLED" ? "Theme enabled" : "Theme disabled" };
}

export async function updateThemeMeta(id: string, input: unknown): Promise<ThemeResult> {
  const admin = await adminId();
  if (!admin) return { ok: false, message: "Unauthorized." };

  const parsed = updateThemeMetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid theme details." };

  await prisma.theme.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      countdownDefault: parsed.data.countdownDefault,
    },
  });
  await logActivity({
    actorType: "ADMIN",
    adminId: admin,
    action: "admin.theme.update",
    entityType: "Theme",
    entityId: id,
    description: `Updated theme ${id} metadata`,
  });
  revalidatePath("/admin/themes");
  return { ok: true, message: "Theme updated" };
}

export async function deleteTheme(id: string): Promise<ThemeResult> {
  const admin = await adminId();
  if (!admin) return { ok: false, message: "Unauthorized." };

  const theme = await prisma.theme.findUnique({ where: { id } });
  if (!theme) return { ok: false, message: "Theme not found." };
  if (theme.isSystem) return { ok: false, message: "Built-in themes can't be deleted." };

  await prisma.theme.delete({ where: { id } }); // cascades assets; links.themeId → null
  await deleteThemeFolder(theme.slug);
  await logActivity({
    actorType: "ADMIN",
    adminId: admin,
    action: "admin.theme.delete",
    entityType: "Theme",
    entityId: id,
    description: `Deleted theme "${theme.name}"`,
  });
  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  return { ok: true, message: "Theme deleted" };
}
