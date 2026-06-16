"use client";

import * as React from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
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

export interface AdminLogRow {
  id: string;
  actorType: "USER" | "ADMIN" | "SYSTEM";
  actor: string;
  action: string;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTOR_VARIANT: Record<string, "default" | "secondary" | "warning"> = {
  ADMIN: "warning",
  USER: "default",
  SYSTEM: "secondary",
};

export function AdminLogsTable({ rows }: { rows: AdminLogRow[] }) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs by action, actor or description…"
          className="pl-9"
        />
      </div>

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden lg:table-cell">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No log entries.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(l.createdAt), "dd MMM, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={ACTOR_VARIANT[l.actorType] ?? "secondary"}>
                        {l.actorType}
                      </Badge>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {l.actor}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.action}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {l.description || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {l.ipAddress || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {rows.length} entries
      </p>
    </div>
  );
}
