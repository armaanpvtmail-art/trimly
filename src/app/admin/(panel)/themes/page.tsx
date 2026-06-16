import type { Metadata } from "next";
import { Palette } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Themes · Admin", robots: { index: false } };

export default async function AdminThemesPage() {
  const themes = await prisma.theme.findMany({
    orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Themes</h1>
        <p className="text-muted-foreground">
          {themes.length} themes installed. ZIP upload &amp; management arrives in
          the next phase.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => (
          <Card key={t.id} className="flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Palette className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">/{t.slug}</p>
            </div>
            <Badge variant={t.status === "ENABLED" ? "success" : "secondary"}>
              {t.status}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
