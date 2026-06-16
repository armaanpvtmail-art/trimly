import type { Metadata } from "next";
import Link from "next/link";
import { Palette, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Themes" };

interface ThemePalette {
  from?: string;
  via?: string;
  to?: string;
}

function gradientFor(config: unknown): string {
  const palette = (config as { palette?: ThemePalette } | null)?.palette;
  const from = palette?.from ?? "#6366f1";
  const via = palette?.via ?? "#a855f7";
  const to = palette?.to ?? "#ec4899";
  return `linear-gradient(135deg, ${from}, ${via}, ${to})`;
}

export default async function ThemesPage() {
  await requireUser();
  const themes = await prisma.theme.findMany({
    where: { status: "ENABLED" },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Themes</h1>
        <p className="text-muted-foreground">
          Pick a redirect experience for your links. Admins can upload more.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const mode =
            (theme.config as { mode?: string } | null)?.mode ?? "dark";
          return (
            <Card key={theme.id} className="group overflow-hidden">
              <div
                className="relative flex h-36 items-center justify-center"
                style={{ background: gradientFor(theme.config) }}
              >
                <div className="absolute inset-0 bg-grid opacity-10" />
                <div className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                  {theme.countdownDefault}s countdown
                </div>
                {theme.isSystem && (
                  <Badge className="absolute right-3 top-3 bg-white/20 text-white">
                    <Sparkles className="size-3" /> Built-in
                  </Badge>
                )}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{theme.name}</h3>
                  <Badge variant="secondary">{mode}</Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {theme.description || "A redirect theme for your links."}
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/create">
                    <Palette className="size-4" /> Use in a link
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
