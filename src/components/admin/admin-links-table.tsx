"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, MoreHorizontal, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { adminToggleLink, adminDeleteLink } from "@/server/actions/admin";
import { clientEnv } from "@/lib/env";
import { formatNumber, truncateMiddle } from "@/lib/utils";

export interface AdminLinkRow {
  id: string;
  slug: string;
  destinationUrl: string;
  ownerEmail: string;
  themeName: string | null;
  clickCount: number;
  status: "ACTIVE" | "DISABLED" | "EXPIRED";
  createdAt: string;
}

export function AdminLinksTable({ rows }: { rows: AdminLinkRow[] }) {
  const router = useRouter();
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const [search, setSearch] = React.useState("");
  const [deleting, setDeleting] = React.useState<AdminLinkRow | null>(null);
  const [pending, start] = React.useTransition();

  const filtered = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (l) =>
        l.slug.toLowerCase().includes(q) ||
        l.destinationUrl.toLowerCase().includes(q) ||
        l.ownerEmail.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function toggle(l: AdminLinkRow) {
    start(async () => {
      const res = await adminToggleLink(l.id);
      res.ok ? toast.success(res.message || "Updated") : toast.error(res.message || "Failed");
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by slug, URL or owner email…"
          className="pl-9"
        />
      </div>

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead className="hidden md:table-cell">Owner</TableHead>
              <TableHead className="hidden lg:table-cell">Destination</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No links found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-sm font-medium">/{l.slug}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {l.ownerEmail}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {truncateMiddle(l.destinationUrl, 40)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(l.clickCount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.status === "ACTIVE" ? "success" : "secondary"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={pending}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`${base}/${l.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink /> Open
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggle(l)}>
                          <Power /> {l.status === "ACTIVE" ? "Disable" : "Enable"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(l)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {rows.length} links
      </p>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete link?</DialogTitle>
            <DialogDescription>
              Permanently delete <span className="font-mono">/{deleting?.slug}</span> and
              its analytics. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!deleting) return;
                start(async () => {
                  const res = await adminDeleteLink(deleting.id);
                  if (res.ok) {
                    toast.success(res.message || "Deleted");
                    setDeleting(null);
                    router.refresh();
                  } else {
                    toast.error(res.message || "Failed");
                  }
                });
              }}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
