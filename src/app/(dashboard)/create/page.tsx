import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CreateLinkForm } from "@/components/links/create-link-form";

export const metadata: Metadata = { title: "Create link" };

export default async function CreatePage() {
  await requireUser();
  const themes = await prisma.theme.findMany({
    where: { status: "ENABLED" },
    select: { id: true, name: true },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a short link</h1>
        <p className="text-muted-foreground">
          Shorten any URL and pick a themed countdown experience.
        </p>
      </div>
      <CreateLinkForm themes={themes} />
    </div>
  );
}
