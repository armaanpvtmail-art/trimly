import {
  LayoutDashboard,
  Users,
  CreditCard,
  Link2,
  Palette,
  Settings,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Links", href: "/admin/links", icon: Link2 },
  { label: "Themes", href: "/admin/themes", icon: Palette },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit logs", href: "/admin/logs", icon: ScrollText },
];
