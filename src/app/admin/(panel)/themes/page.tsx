import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ThemeUploadForm } from "@/components/admin/theme-upload-form";
import {
  AdminThemesManager,
  type AdminThemeRow,
} from "@/components/admin/admin-themes-manager";

export const metadata: Metadata = { title: "Themes · Admin", robots: { index: false } };

export default async function AdminThemesPage() {
  const themes = await prisma.theme.findMany({
    orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
  });

  const rows: AdminThemeRow[] = themes.map((t) => {
    const cfg = (t.config ?? {}) as { palette?: AdminThemeRow["palette"] };
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      status: t.status,
      isSystem: t.isSystem,
      previewImage: t.previewImage,
      countdownDefault: t.countdownDefault,
      hasEntry: !!t.entryHtml,
      palette: cfg.palette ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Themes</h1>
        <p className="text-muted-foreground">
          Upload custom redirect themes and manage the gallery.
        </p>
      </div>

      <ThemeUploadForm />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Installed themes</h2>
        <AdminThemesManager themes={rows} />
      </div>
    </div>
  );
}
