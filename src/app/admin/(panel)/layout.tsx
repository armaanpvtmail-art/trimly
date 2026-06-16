import { requireAdmin } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <AdminShell
      admin={{ name: admin.name, email: admin.email, role: admin.role }}
    >
      {children}
    </AdminShell>
  );
}
