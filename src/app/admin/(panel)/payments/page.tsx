import type { Metadata } from "next";
import { listAdminPayments } from "@/server/queries/admin-data";
import { AdminPaymentsTable } from "@/components/admin/admin-payments-table";

export const metadata: Metadata = { title: "Payments · Admin", robots: { index: false } };

export default async function AdminPaymentsPage() {
  const rows = await listAdminPayments();
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          All Cashfree orders and transactions across the platform.
        </p>
      </div>
      <AdminPaymentsTable rows={rows} />
    </div>
  );
}
