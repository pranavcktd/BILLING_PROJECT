import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import {
  setDefaultBankAccount,
  deleteBankAccount,
  updateEmailSettings,
  restoreOrganizationData,
} from "@/lib/actions/settings";
import { SettingsProfileForm } from "@/components/settings-profile-form";
import { EmailSettingsForm } from "@/components/email-settings-form";
import { RestoreConfirmDialog } from "@/components/restore-confirm-dialog";
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
import { getCurrentOrgId } from "@/lib/tenant-context";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireModulePermission("settings", "VIEW");
  const { error } = await searchParams;

  const organizationId = await getCurrentOrgId();
  const [firmProfile, bankAccounts, emailSettings, organization] = await Promise.all([
    prisma.firmProfile.findUnique({ where: { organizationId } }),
    prisma.bankAccount.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.emailSettings.findUnique({ where: { organizationId } }),
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your firm details and bank accounts appear on generated PDFs.
        </p>
      </div>

      {error === "bank-in-use" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          That bank account can&apos;t be deleted because it&apos;s used on an existing invoice.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Firm Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsProfileForm
            firmProfile={{
              name: firmProfile?.name ?? "",
              address: firmProfile?.address ?? null,
              phone: firmProfile?.phone ?? null,
              email: firmProfile?.email ?? null,
              website: firmProfile?.website ?? null,
              gstin: firmProfile?.gstin ?? null,
              signatureImage: firmProfile?.signatureImage ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailSettingsForm
            action={updateEmailSettings}
            settings={{
              smtpHost: emailSettings?.smtpHost ?? null,
              smtpPort: emailSettings?.smtpPort ?? null,
              smtpUser: emailSettings?.smtpUser ?? null,
              hasPassword: !!emailSettings?.smtpPass,
              fromName: emailSettings?.fromName ?? null,
              fromEmail: emailSettings?.fromEmail ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Bank Accounts</CardTitle>
          <Button size="sm" nativeButton={false} render={<Link href="/settings/banks/new" />}>
            Add Bank Account
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {bankAccounts.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No bank accounts yet. Add one so it can be printed on invoices.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account No.</TableHead>
                  <TableHead>IFSC</TableHead>
                  <TableHead />
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((bank) => {
                  const actions: RowAction[] = [
                    { type: "link", label: "Edit", href: `/settings/banks/${bank.id}/edit` },
                  ];
                  if (!bank.isDefault) {
                    actions.push({
                      type: "action",
                      label: "Set as Default",
                      action: setDefaultBankAccount.bind(null, bank.id),
                    });
                  }
                  actions.push({
                    type: "action",
                    label: "Delete",
                    action: deleteBankAccount.bind(null, bank.id),
                    confirmMessage: "Delete this bank account?",
                    destructive: true,
                  });
                  return (
                    <TableRow key={bank.id}>
                      <TableCell className="font-medium">{bank.bankName}</TableCell>
                      <TableCell>{bank.accountName}</TableCell>
                      <TableCell>{bank.accountNumber}</TableCell>
                      <TableCell>{bank.ifscCode}</TableCell>
                      <TableCell>
                        {bank.isDefault && <Badge>Default</Badge>}
                      </TableCell>
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

      {session.user.role === "ADVOCATE" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Download a full export of all your clients, matters, quotations,
                contracts, invoices, payments, and settings. Login passwords and SMTP
                passwords are not included in any export for security.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" nativeButton={false} render={<a href="/api/backup?format=json" />}>
                  Download JSON
                </Button>
                <Button variant="outline" nativeButton={false} render={<a href="/api/backup?format=xlsx" />}>
                  Download Excel
                </Button>
                <Button variant="outline" nativeButton={false} render={<a href="/api/backup?format=sql" />}>
                  Download SQL
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Restoring replaces all of your current data with the contents of a JSON
                backup file. This cannot be undone, though a safety backup of your
                current data is always emailed to you first.
              </p>
              <RestoreConfirmDialog orgName={organization.name} action={restoreOrganizationData} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
