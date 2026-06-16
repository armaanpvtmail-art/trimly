"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ExternalLink, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/links/copy-button";
import { QrDialog } from "@/components/links/qr-dialog";
import { createLink } from "@/server/actions/links";
import { clientEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

const COUNTDOWN_OPTIONS = [
  { value: "0", label: "Instant (0s)" },
  { value: "3", label: "3 seconds" },
  { value: "5", label: "5 seconds" },
  { value: "8", label: "8 seconds" },
  { value: "10", label: "10 seconds" },
  { value: "15", label: "15 seconds" },
];

export function CreateLinkForm({
  themes,
}: {
  themes: { id: string; name: string }[];
}) {
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [theme, setTheme] = React.useState("none");
  const [countdown, setCountdown] = React.useState("5");
  const [result, setResult] = React.useState<{ slug: string } | null>(null);

  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const shortUrl = result ? `${base}/${result.slug}` : "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = new FormData(e.currentTarget);
    const values = {
      destinationUrl: String(form.get("destinationUrl") || ""),
      title: String(form.get("title") || ""),
      customSlug: String(form.get("customSlug") || ""),
      themeId: theme === "none" ? "" : theme,
      countdownSeconds: countdown,
    };

    setLoading(true);
    const res = await createLink(values);
    setLoading(false);

    if (!res.ok || !res.slug) {
      setErrors(res.fieldErrors || {});
      if (res.message) toast.error(res.message);
      return;
    }
    toast.success("Short link created!");
    setResult({ slug: res.slug });
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Trimly link", url: shortUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shortUrl);
      toast.success("Link copied to share");
    }
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b bg-success/5 p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold">Your link is ready</h3>
              <p className="text-sm text-muted-foreground">
                Share it anywhere — it opens your themed countdown page.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-3">
              <Link2 className="size-4 shrink-0 text-primary" />
              <span className="flex-1 truncate font-mono text-sm">{shortUrl}</span>
              <CopyButton value={shortUrl} />
            </div>
            <div className="flex flex-wrap gap-2">
              <QrDialog url={shortUrl} />
              <Button variant="outline" onClick={share}>
                <Share2 className="size-4" /> Share
              </Button>
              <Button variant="outline" asChild>
                <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" /> Open
                </a>
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" onClick={() => setResult(null)}>
                Create another
              </Button>
              <Button variant="gradient" asChild>
                <Link href="/links">
                  My links <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="destinationUrl">Destination URL</Label>
          <Input
            id="destinationUrl"
            name="destinationUrl"
            placeholder="https://your-long-url.com/page"
            aria-invalid={!!errors.destinationUrl}
          />
          {errors.destinationUrl && (
            <p className="text-xs text-destructive">{errors.destinationUrl}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" name="title" placeholder="Spring campaign" />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customSlug">Custom slug (optional)</Label>
            <div className="flex items-center rounded-lg border border-input bg-background pl-3 focus-within:ring-2 focus-within:ring-ring">
              <span className="text-sm text-muted-foreground">/</span>
              <input
                id="customSlug"
                name="customSlug"
                placeholder="my-link"
                className="h-10 w-full bg-transparent px-1 text-sm outline-none"
              />
            </div>
            {errors.customSlug && (
              <p className="text-xs text-destructive">{errors.customSlug}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No theme (instant)</SelectItem>
                {themes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Countdown duration</Label>
            <Select value={countdown} onValueChange={setCountdown}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTDOWN_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className={cn("w-full sm:w-auto")}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Generate short link
        </Button>
      </form>
    </Card>
  );
}
