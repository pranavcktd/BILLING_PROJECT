import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import {
  resetAdminPassword,
  setOrganizationSubscriptionStatus,
} from "@/lib/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default async function SuperAdminDashboard() {
  await requireSuperAdmin();

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { users: { where: { role: "ADVOCATE" } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Onboard firms and manage their subscription access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/super-admin/settings" />}>
            System Email Settings
          </Button>
          <Button nativeButton={false} render={<Link href="/super-admin/organizations/new" />}>
            Onboard New Admin
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Organizations ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {organizations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No organizations yet. Onboard the first one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead>Admin Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const admin = org.users[0];
                  const actions: RowAction[] = [
                    { type: "link", label: "Manage", href: `/super-admin/organizations/${org.id}` },
                  ];
                  if (admin) {
                    actions.push({
                      type: "action",
                      label: "Reset Password",
                      action: resetAdminPassword.bind(null, admin.id),
                      confirmMessage: `Reset ${admin.email}'s password back to the default (Client@123)? They'll be required to change it on next login.`,
                    });
                  }
                  if (org.subscriptionStatus === "ACTIVE") {
                    actions.push({
                      type: "action",
                      label: "Suspend",
                      action: setOrganizationSubscriptionStatus.bind(null, org.id, "SUSPENDED"),
                      confirmMessage: `Suspend ${org.name}? Their admin and clients will not be able to log in until reactivated.`,
                      destructive: true,
                    });
                  } else {
                    actions.push({
                      type: "action",
                      label: "Reactivate",
                      action: setOrganizationSubscriptionStatus.bind(null, org.id, "ACTIVE"),
                      confirmMessage: `Reactivate ${org.name}?`,
                    });
                  }
                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{org.profession ?? "—"}</TableCell>
                      <TableCell>{admin?.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={org.subscriptionStatus === "ACTIVE" ? "default" : "destructive"}>
                          {org.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {org.subscriptionStartDate || org.subscriptionEndDate
                          ? `${org.subscriptionStartDate?.toLocaleDateString() ?? "—"} – ${org.subscriptionEndDate?.toLocaleDateString() ?? "—"}`
                          : "—"}
                      </TableCell>
                      <TableCell>{org.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <RowActionsMenu actions={actions} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
