"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, CalendarPlus, CheckCircle2, Loader2, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  setUserStatus,
  deleteUser,
  extendUserSubscription,
} from "@/server/actions/admin";
import { formatDate, daysRemaining } from "@/lib/utils";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  emailVerified: boolean;
  createdAt: string;
  linkCount: number;
  paymentCount: number;
  subscriptionExpiresAt: string | null;
}

export function AdminUsersTable({ rows }: { rows: AdminUserRow[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [extendUser, setExtendUser] = React.useState<AdminUserRow | null>(null);
  const [deleteUserRow, setDeleteUserRow] = React.useState<AdminUserRow | null>(null);
  const [pending, start] = React.useTransition();

  const filtered = React.useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (status !== "ALL") r = r.filter((u) => u.status === status);
    return r;
  }, [rows, search, status]);

  function toggleStatus(u: AdminUserRow) {
    start(async () => {
      const res = await setUserStatus(u.id, u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
      res.ok ? toast.success(res.message || "Updated") : toast.error(res.message || "Failed");
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All users</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden md:table-cell text-right">Links</TableHead>
              <TableHead className="hidden sm:table-cell">Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const active = !!u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) > new Date();
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {active ? (
                        <Badge variant="default">
                          {daysRemaining(u.subscriptionExpiresAt)}d left
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No plan</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">{u.linkCount}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={pending}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(u)}>
                            {u.status === "ACTIVE" ? (
                              <>
                                <Ban /> Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle2 /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setExtendUser(u)}>
                            <CalendarPlus /> Extend subscription
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteUserRow(u)}
                          >
                            <Trash2 /> Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {rows.length} users
      </p>

      <ExtendDialog user={extendUser} onClose={() => setExtendUser(null)} />
      <DeleteUserDialog user={deleteUserRow} onClose={() => setDeleteUserRow(null)} />
    </div>
  );
}

function ExtendDialog({ user, onClose }: { user: AdminUserRow | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [days, setDays] = React.useState("30");

  function submit() {
    if (!user) return;
    start(async () => {
      const res = await extendUserSubscription({ userId: user.id, days });
      if (res.ok) {
        toast.success(res.message || "Extended");
        onClose();
        router.refresh();
      } else {
        toast.error(res.message || "Failed");
      }
    });
  }

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Extend subscription</DialogTitle>
          <DialogDescription>
            Add days to {user?.email}&apos;s subscription (creates one if none).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="days">Days to add</Label>
          <Input
            id="days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ user, onClose }: { user: AdminUserRow | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function confirm() {
    if (!user) return;
    start(async () => {
      const res = await deleteUser(user.id);
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
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete user?</DialogTitle>
          <DialogDescription>
            This permanently deletes {user?.email} and all their links, analytics
            and subscriptions. This can&apos;t be undone.
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
