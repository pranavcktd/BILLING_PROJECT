import { requireSuperAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  inviteSuperAdmin,
  resetSuperAdminPassword,
  setSuperAdminActive,
  deleteSuperAdmin,
} from "@/lib/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActionsMenu, type RowAction } from "@/components/row-actions-menu";

export default async function SuperAdminTeamPage() {
  const session = await requireSuperAdmin();

  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team &amp; Roles</h1>
        <p className="text-sm text-muted-foreground">
          Manage who has Super Admin access to this platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite Super Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteSuperAdmin} className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Login Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button type="submit">Invite</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            New logins start with the default password (Client@123) and must change it on
            first sign-in.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Super Admins ({superAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {superAdmins.map((admin) => {
                const isSelf = admin.id === session.user.id;
                const actions: RowAction[] = [
                  {
                    type: "action",
                    label: "Reset Password",
                    action: resetSuperAdminPassword.bind(null, admin.id),
                    confirmMessage: `Reset ${admin.email}'s password back to the default (Client@123)? They'll be required to change it on next login.`,
                  },
                ];
                if (admin.isActive) {
                  actions.push({
                    type: "action",
                    label: "Deactivate",
                    action: setSuperAdminActive.bind(null, admin.id, false),
                    confirmMessage: isSelf
                      ? "Deactivate your own Super Admin login? You will be signed out and unable to log back in."
                      : `Deactivate ${admin.email}?`,
                    destructive: true,
                  });
                } else {
                  actions.push({
                    type: "action",
                    label: "Reactivate",
                    action: setSuperAdminActive.bind(null, admin.id, true),
                  });
                }
                actions.push({
                  type: "action",
                  label: "Delete",
                  action: deleteSuperAdmin.bind(null, admin.id),
                  confirmMessage: isSelf
                    ? "Delete your own Super Admin login? You will be signed out permanently."
                    : `Delete ${admin.email}? This cannot be undone.`,
                  destructive: true,
                });

                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.name}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {admin.isActive ? <Badge>Active</Badge> : <Badge variant="destructive">Deactivated</Badge>}
                    </TableCell>
                    <TableCell>{admin.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <RowActionsMenu actions={actions} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
