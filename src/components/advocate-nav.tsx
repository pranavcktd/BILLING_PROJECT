"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ScrollText,
  Receipt,
  Wallet,
  Package,
  TrendingDown,
  BarChart3,
  Settings,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, type ModuleName } from "@/lib/permissions";

const links: { href: string; label: string; icon: typeof LayoutDashboard; module: ModuleName | null }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: null },
  { href: "/clients", label: "Clients", icon: Users, module: "clients" },
  { href: "/quotations", label: "Quotations", icon: FileText, module: "quotations" },
  { href: "/contracts", label: "Contracts", icon: ScrollText, module: "contracts" },
  { href: "/invoices", label: "Invoices", icon: Receipt, module: "invoices" },
  { href: "/payments", label: "Payments", icon: Wallet, module: "payments" },
  { href: "/services", label: "Services & Products", icon: Package, module: "services" },
  { href: "/expenses", label: "Expenses", icon: TrendingDown, module: "expenses" },
  { href: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
  { href: "/settings", label: "Settings", icon: Settings, module: "settings" },
];

export function AdvocateNav({
  role,
  permissions,
}: {
  role: "ADVOCATE" | "STAFF" | "CLIENT" | "SUPER_ADMIN";
  permissions: Partial<Record<ModuleName, string>>;
}) {
  const pathname = usePathname();
  const isAdvocate = role === "ADVOCATE";

  const visibleLinks = links.filter(
    (link) => isAdvocate || !link.module || hasPermission(permissions, link.module, "VIEW")
  );

  return (
    <nav className="flex flex-col gap-1">
      {visibleLinks.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
      {isAdvocate && (
        <Link
          href="/settings/team"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings/team")
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <UsersRound className="size-4 shrink-0" />
          Team
        </Link>
      )}
    </nav>
  );
}
