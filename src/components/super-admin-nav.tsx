"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, BarChart3, UsersRound, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/super-admin", label: "Organizations", icon: Building2 },
  { href: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/super-admin/team", label: "Team & Roles", icon: UsersRound },
  { href: "/super-admin/activity", label: "Activity Log", icon: History },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

export function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active =
          pathname === link.href || (link.href !== "/super-admin" && pathname.startsWith(link.href + "/"));
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
    </nav>
  );
}
