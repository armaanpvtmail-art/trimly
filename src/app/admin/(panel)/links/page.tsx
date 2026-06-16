import type { Metadata } from "next";
import { listAdminLinks } from "@/server/queries/admin-data";
import { AdminLinksTable } from "@/components/admin/admin-links-table";

export const metadata: Metadata = { title: "Links · Admin", robots: { index: false } };

export default async function AdminLinksPage() {
  const rows = await listAdminLinks();
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All links</h1>
        <p className="text-muted-foreground">
          Moderate every short link on the platform.
        </p>
      </div>
      <AdminLinksTable rows={rows} />
    </div>
  );
}
