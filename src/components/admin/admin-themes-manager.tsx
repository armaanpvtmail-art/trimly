"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setThemeStatus, deleteTheme, updateThemeMeta } from "@/server/actions/admin-themes";

export interface AdminThemeRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "ENABLED" | "DISABLED" | "DRAFT";
  isSystem: boolean;
  previewImage: string | null;
  countdownDefault: number;
  hasEntry: boolean;
  palette: { from?: string; via?: string; to?: string } | null;
}

function gradient(p: AdminThemeRow["palette"]) {
  const from = p?.from ?? "#6366f1";
  const via = p?.via ?? "#a855f7";
  const to = p?.to ?? "#ec4899";
  return `linear-gradient(135deg, ${from}, ${via}, ${to})`;
}

export function AdminThemesManager({ themes }: { themes: AdminThemeRow[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [editing, setEditing] = React.useState<AdminThemeRow | null>(null);
  const [deleting, setDeleting] = React.useState<AdminThemeRow | null>(null);
  const [preview, setPreview] = React.useState<AdminThemeRow | null>(null);

  function toggle(t: AdminThemeRow) {
    start(async () => {
      const res = await setThemeStatus(t.id, t.status === "ENABLED" ? "DISABLED" : "ENABLED");
      res.ok ? toast.success(res.message || "Updated") : toast.error(res.message || "Failed");
      if (res.ok) router.refresh();
    });
  }

  if (themes.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        No themes yet. Upload your first theme above.
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => (
          <Card key={t.id} className="overflow-hidden">
            <div
              className="relative flex h-32 items-center justify-center"
              style={
                t.previewImage
                  ? { backgroundImage: `url(${t.previewImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: gradient(t.palette) }
              }
            >
              {!t.previewImage && (
                <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                  {t.name}
                </span>
              )}
              {t.isSystem && (
                <Badge className="absolute right-3 top-3 bg-white/20 text-white">
                  <Sparkles className="size-3" /> Built-in
                </Badge>
              )}
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">/{t.slug}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={pending}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {t.hasEntry && (
                      <DropdownMenuItem onClick={() => setPreview(t)}>
                        <Eye /> Preview
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setEditing(t)}>
                      <Pencil /> Edit metadata
                    </DropdownMenuItem>
                    {!t.isSystem && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(t)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={t.status === "ENABLED" ? "success" : "secondary"}>
                  {t.status}
                </Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t.status === "ENABLED" ? "Enabled" : "Disabled"}
                  <Switch
                    checked={t.status === "ENABLED"}
                    disabled={pending}
                    onCheckedChange={() => toggle(t)}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <EditThemeDialog theme={editing} onClose={() => setEditing(null)} />
      <DeleteThemeDialog theme={deleting} onClose={() => setDeleting(null)} />
      <PreviewDialog theme={preview} onClose={() => setPreview(null)} />
    </>
  );
}

function EditThemeDialog({ theme, onClose }: { theme: AdminThemeRow | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!theme) return;
    const form = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateThemeMeta(theme.id, {
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
        countdownDefault: String(form.get("countdownDefault") || "5"),
      });
      if (res.ok) {
        toast.success(res.message || "Saved");
        onClose();
        router.refresh();
      } else {
        toast.error(res.message || "Failed");
      }
    });
  }

  return (
    <Dialog open={!!theme} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit theme</DialogTitle>
          <DialogDescription>Update display details for {theme?.name}.</DialogDescription>
        </DialogHeader>
        {theme && (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" name="name" defaultValue={theme.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Description</Label>
              <Input id="t-desc" name="description" defaultValue={theme.description ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-cd">Default countdown (seconds)</Label>
              <Input
                id="t-cd"
                name="countdownDefault"
                type="number"
                min={0}
                max={60}
                defaultValue={theme.countdownDefault}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteThemeDialog({ theme, onClose }: { theme: AdminThemeRow | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function confirm() {
    if (!theme) return;
    start(async () => {
      const res = await deleteTheme(theme.id);
      if (res.ok) {
        toast.success(res.message || "Deleted");
        onClose();
        router.refresh();
      } else {
        toast.error(res.message || "Failed");
      }
    });
  }

  return (
    <Dialog open={!!theme} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete theme?</DialogTitle>
          <DialogDescription>
            This removes “{theme?.name}” and its files. Links using it fall back to
            no theme. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ theme, onClose }: { theme: AdminThemeRow | null; onClose: () => void }) {
  return (
    <Dialog open={!!theme} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Preview · {theme?.name}</DialogTitle>
          <DialogDescription>
            Live render with a sample destination and 5s countdown.
          </DialogDescription>
        </DialogHeader>
        {theme && (
          <iframe
            title="Theme preview"
            src={`/api/themes/${theme.slug}/render?to=https://example.com&c=5`}
            className="h-[460px] w-full rounded-b-2xl border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
