import type { Metadata } from "next";
import { listAuditLogs } from "@/server/queries/admin-data";
import { AdminLogsTable } from "@/components/admin/admin-logs-table";

export const metadata: Metadata = { title: "Audit logs · Admin", robots: { index: false } };

export default async function AdminLogsPage() {
  const rows = await listAuditLogs();
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit logs</h1>
        <p className="text-muted-foreground">
          A chronological record of user and admin activity.
        </p>
      </div>
      <AdminLogsTable rows={rows} />
    </div>
  );
}
