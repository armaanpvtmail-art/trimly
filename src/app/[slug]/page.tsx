import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveLink } from "@/server/queries/redirect";
import { recordClick } from "@/server/analytics";
import { RedirectExperience } from "@/components/redirect/redirect-experience";
import { LinkUnavailable } from "@/components/redirect/link-unavailable";

export const dynamic = "force-dynamic";

// Short-link pages should never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await resolveLink(slug);

  if (!link) return <LinkUnavailable reason="notfound" />;
  if (link.status === "DISABLED") return <LinkUnavailable reason="disabled" />;

  const expired =
    link.status === "EXPIRED" ||
    (link.expiresAt ? new Date(link.expiresAt) < new Date() : false);
  if (expired) return <LinkUnavailable reason="expired" />;

  // Best-effort click capture (bot/prefetch-aware). Never block the redirect.
  try {
    await recordClick(link.id, await headers());
  } catch {
    /* analytics must not break redirects */
  }

  return (
    <RedirectExperience
      destinationUrl={link.destinationUrl}
      countdownSeconds={link.countdownSeconds}
      theme={link.theme}
    />
  );
}
