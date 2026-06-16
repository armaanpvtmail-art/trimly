import { prisma } from "@/lib/prisma";
import { RESERVED_SLUGS } from "@/lib/slug";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "theme"
  );
}

/** Produce a unique, non-reserved theme slug derived from the name. */
export async function uniqueThemeSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = RESERVED_SLUGS.has(base) ? `${base}-theme` : base;
  let n = 1;
  // Loop until we find a free slug.
  while (await prisma.theme.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
