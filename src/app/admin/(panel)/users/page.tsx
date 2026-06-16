import type { Metadata } from "next";
import { listAdminUsers } from "@/server/queries/admin-data";
import { AdminUsersTable } from "@/components/admin/admin-users-table";

export const metadata: Metadata = { title: "Users · Admin", robots: { index: false } };

export default async function AdminUsersPage() {
  const rows = await listAdminUsers();
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage accounts, subscriptions and access.
        </p>
      </div>
      <AdminUsersTable rows={rows} />
    </div>
  );
}
