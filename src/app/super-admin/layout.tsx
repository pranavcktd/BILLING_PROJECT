import { Shield } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { SuperAdminNav } from "@/components/super-admin-nav";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSuperAdmin();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Shield className="size-4.5" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Super Admin
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <SuperAdminNav />
        </div>
        <div className="border-t border-sidebar-border px-3 py-4">
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="truncate text-sm text-sidebar-foreground/80">
              {session.user.name}
            </span>
            <SignOutButton className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          </div>
        </div>
      </aside>
      <div className="flex-1 pl-64">
        <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
