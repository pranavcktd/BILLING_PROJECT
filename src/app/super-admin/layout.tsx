import { Shield } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-8 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="size-4.5" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Super Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-8 py-8">{children}</main>
    </div>
  );
}
