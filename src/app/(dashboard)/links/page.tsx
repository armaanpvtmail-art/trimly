import type { Metadata } from "next";
import Link from "next/link";
import { Link2, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinksTable, type LinkRow } from "@/components/links/links-table";

export const metadata: Metadata = { title: "My links" };

export default async function LinksPage() {
  const user = await requireUser();
  const [links, themes] = await Promise.all([
    prisma.shortLink.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { theme: { select: { name: true } } },
    }),
    prisma.theme.findMany({
      where: { status: "ENABLED" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows: LinkRow[] = links.map((l) => ({
    id: l.id,
    slug: l.slug,
    destinationUrl: l.destinationUrl,
    title: l.title,
    themeId: l.themeId,
    themeName: l.theme?.name ?? null,
    countdownSeconds: l.countdownSeconds,
    clickCount: l.clickCount,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My links</h1>
          <p className="text-muted-foreground">
            Manage, edit and track all your short links.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/create">
            <Plus className="size-4" /> Create link
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Link2 className="size-7" />
          </div>
          <div>
            <p className="text-lg font-semibold">No links yet</p>
            <p className="text-muted-foreground">
              Create your first short link to get started.
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link href="/create">
              <Plus className="size-4" /> Create your first link
            </Link>
          </Button>
        </Card>
      ) : (
        <LinksTable links={rows} themes={themes} />
      )}
    </div>
  );
}
