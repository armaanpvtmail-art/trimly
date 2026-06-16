import {
  LayoutDashboard,
  Plus,
  Link2,
  BarChart3,
  Palette,
  CreditCard,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Create Link", href: "/create", icon: Plus },
  { label: "My Links", href: "/links", icon: Link2 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Themes", href: "/themes", icon: Palette },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
  { label: "Profile", href: "/profile", icon: User },
];

// Compact set for the mobile bottom navigation bar.
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Create", href: "/create", icon: Plus },
  { label: "Links", href: "/links", icon: Link2 },
  { label: "Stats", href: "/analytics", icon: BarChart3 },
  { label: "Profile", href: "/profile", icon: User },
];
