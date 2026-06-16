"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CopyButton } from "@/components/links/copy-button";
import { QrDialog } from "@/components/links/qr-dialog";
import { updateLink, toggleLinkStatus, deleteLink } from "@/server/actions/links";
import { clientEnv } from "@/lib/env";
import { formatDate, formatNumber, truncateMiddle } from "@/lib/utils";

export interface LinkRow {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  themeId: string | null;
  themeName: string | null;
  countdownSeconds: number;
  clickCount: number;
  status: "ACTIVE" | "DISABLED" | "EXPIRED";
  createdAt: string;
}

const COUNTDOWN_OPTIONS = ["0", "3", "5", "8", "10", "15"];

export function LinksTable({
  links,
  themes,
}: {
  links: LinkRow[];
  themes: { id: string; name: string }[];
}) {
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [sort, setSort] = React.useState("newest");
  const [editing, setEditing] = React.useState<LinkRow | null>(null);
  const [deleting, setDeleting] = React.useState<LinkRow | null>(null);

  const filtered = React.useMemo(() => {
    let rows = [...links];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.slug.toLowerCase().includes(q) ||
          r.destinationUrl.toLowerCase().includes(q) ||
          (r.title || "").toLowerCase().includes(q),
      );
    }
    if (status !== "ALL") rows = rows.filter((r) => r.status === status);
    switch (sort) {
      case "oldest":
        rows.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case "most_clicks":
        rows.sort((a, b) => b.clickCount - a.clickCount);
        break;
      case "az":
        rows.sort((a, b) => a.slug.localeCompare(b.slug));
        break;
      default:
        rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return rows;
  }, [links, search, status, sort]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by slug, URL or title…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="most_clicks">Most clicks</SelectItem>
            <SelectItem value="az">A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Short link</TableHead>
              <TableHead className="hidden md:table-cell">Destination</TableHead>
              <TableHead className="hidden lg:table-cell">Theme</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No links found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const shortUrl = `${base}/${row.slug}`;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">/{row.slug}</span>
                        <CopyButton value={shortUrl} size="icon" variant="ghost" />
                      </div>
                      {row.title && (
                        <p className="text-xs text-muted-foreground">{row.title}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {truncateMiddle(row.destinationUrl, 42)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {row.themeName ? (
                        <Badge variant="secondary">{row.themeName}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(row.clickCount)}
                    </TableCell>
                    <TableCell>
                      <StatusToggle row={row} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        row={row}
                        shortUrl={shortUrl}
                        onEdit={() => setEditing(row)}
                        onDelete={() => setDeleting(row)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {links.length} links
      </p>

      <EditLinkDialog
        link={editing}
        themes={themes}
        onClose={() => setEditing(null)}
      />
      <DeleteLinkDialog link={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function StatusToggle({ row }: { row: LinkRow }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const active = row.status === "ACTIVE";

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={active}
        disabled={pending || row.status === "EXPIRED"}
        onCheckedChange={() =>
          start(async () => {
            const res = await toggleLinkStatus(row.id);
            if (res.ok) {
              toast.success(res.message || "Updated");
              router.refresh();
            } else {
              toast.error(res.message || "Failed");
            }
          })
        }
      />
      <Badge variant={active ? "success" : "secondary"}>
        {active ? "Active" : row.status === "EXPIRED" ? "Expired" : "Disabled"}
      </Badge>
    </div>
  );
}

function RowActions({
  row,
  shortUrl,
  onEdit,
  onDelete,
}: {
  row: LinkRow;
  shortUrl: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <QrDialog
        url={shortUrl}
        trigger={
          <Button variant="ghost" size="icon" aria-label="QR code">
            <span className="sr-only">QR</span>
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM20 14v7M17 20h4" />
            </svg>
          </Button>
        }
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Open link
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EditLinkDialog({
  link,
  themes,
  onClose,
}: {
  link: LinkRow | null;
  themes: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [theme, setTheme] = React.useState("none");
  const [countdown, setCountdown] = React.useState("5");

  React.useEffect(() => {
    if (link) {
      setTheme(link.themeId ?? "none");
      setCountdown(String(link.countdownSeconds));
      setErrors({});
    }
  }, [link]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!link) return;
    const form = new FormData(e.currentTarget);
    const values = {
      destinationUrl: String(form.get("destinationUrl") || ""),
      title: String(form.get("title") || ""),
      themeId: theme === "none" ? "" : theme,
      countdownSeconds: countdown,
    };
    start(async () => {
      const res = await updateLink(link.id, values);
      if (res.ok) {
        toast.success("Link updated");
        onClose();
        router.refresh();
      } else {
        setErrors(res.fieldErrors || {});
        if (res.message) toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open={!!link} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit link</DialogTitle>
          <DialogDescription>
            Update where <span className="font-mono">/{link?.slug}</span> points and
            how it opens.
          </DialogDescription>
        </DialogHeader>
        {link && (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="edit-url">Destination URL</Label>
              <Input
                id="edit-url"
                name="destinationUrl"
                defaultValue={link.destinationUrl}
              />
              {errors.destinationUrl && (
                <p className="text-xs text-destructive">{errors.destinationUrl}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" name="title" defaultValue={link.title ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No theme</SelectItem>
                    {themes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Countdown</Label>
                <Select value={countdown} onValueChange={setCountdown}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTDOWN_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteLinkDialog({
  link,
  onClose,
}: {
  link: LinkRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function confirm() {
    if (!link) return;
    start(async () => {
      const res = await deleteLink(link.id);
      if (res.ok) {
        toast.success("Link deleted");
        onClose();
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete");
      }
    });
  }

  return (
    <Dialog open={!!link} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete link?</DialogTitle>
          <DialogDescription>
            This permanently deletes <span className="font-mono">/{link?.slug}</span>{" "}
            and all of its analytics. This can&apos;t be undone.
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
