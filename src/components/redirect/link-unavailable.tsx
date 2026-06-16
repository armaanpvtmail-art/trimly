import Link from "next/link";
import { Ban, Clock, LinkIcon, SearchX } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

type Reason = "notfound" | "disabled" | "expired";

const CONTENT: Record<
  Reason,
  { icon: React.ReactNode; title: string; desc: string }
> = {
  notfound: {
    icon: <SearchX className="size-8" />,
    title: "Link not found",
    desc: "This short link doesn't exist or may have been deleted.",
  },
  disabled: {
    icon: <Ban className="size-8" />,
    title: "Link disabled",
    desc: "The owner has temporarily disabled this link.",
  },
  expired: {
    icon: <Clock className="size-8" />,
    title: "Link expired",
    desc: "This short link has passed its expiry date.",
  },
};

export function LinkUnavailable({ reason }: { reason: Reason }) {
  const c = CONTENT[reason];
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute inset-x-0 top-0 h-[400px] bg-radial-fade" />
      </div>

      <div className="mb-8">
        <Logo />
      </div>
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {c.icon}
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{c.title}</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">{c.desc}</p>
      <div className="mt-8 flex gap-3">
        <Button variant="gradient" asChild>
          <Link href="/">
            <LinkIcon className="size-4" /> Create your own short links
          </Link>
        </Button>
      </div>
    </div>
  );
}
