import { prismaUnscoped } from "@/lib/prisma";

// Shared data-fetching for all backup formats (JSON/Excel/SQL) and the
// restore flow's mandatory pre-restore safety copy. Uses the unscoped
// client with explicit organizationId filters throughout so it works both
// for a self-service Admin's own org and for a Super Admin reading any org.
export async function getOrgBackupData(organizationId: string) {
  const [
    clients,
    matters,
    quotations,
    quotationItems,
    contracts,
    invoices,
    invoiceItems,
    invoiceBankAccounts,
    payments,
    bankAccounts,
    serviceItems,
    expenses,
    firmProfile,
    emailSettings,
    clientNotes,
    users,
  ] = await Promise.all([
    prismaUnscoped.client.findMany({ where: { organizationId } }),
    prismaUnscoped.matter.findMany({ where: { organizationId } }),
    prismaUnscoped.quotation.findMany({ where: { organizationId } }),
    prismaUnscoped.quotationItem.findMany({ where: { quotation: { organizationId } } }),
    prismaUnscoped.contract.findMany({ where: { organizationId } }),
    prismaUnscoped.invoice.findMany({ where: { organizationId } }),
    prismaUnscoped.invoiceItem.findMany({ where: { invoice: { organizationId } } }),
    prismaUnscoped.invoiceBankAccount.findMany({ where: { invoice: { organizationId } } }),
    prismaUnscoped.payment.findMany({ where: { organizationId } }),
    prismaUnscoped.bankAccount.findMany({ where: { organizationId } }),
    prismaUnscoped.serviceItem.findMany({ where: { organizationId } }),
    prismaUnscoped.expense.findMany({ where: { organizationId } }),
    prismaUnscoped.firmProfile.findUnique({ where: { organizationId } }),
    // smtpPass is a live credential (often a plaintext app password), not a
    // one-way hash — excluded from every backup format for the same reason
    // passwordHash is excluded from User, just with no restore-time re-hash
    // possible; the org re-enters it after a restore.
    prismaUnscoped.emailSettings.findUnique({
      where: { organizationId },
      select: {
        id: true,
        organizationId: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        fromName: true,
        fromEmail: true,
        updatedAt: true,
      },
    }),
    prismaUnscoped.clientNote.findMany({ where: { organizationId } }),
    prismaUnscoped.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clientId: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash intentionally excluded — never leaves the DB.
      },
    }),
  ]);

  return {
    clients,
    matters,
    quotations,
    quotationItems,
    contracts,
    invoices,
    invoiceItems,
    invoiceBankAccounts,
    payments,
    bankAccounts,
    serviceItems,
    expenses,
    firmProfile,
    emailSettings,
    clientNotes,
    users,
  };
}

export type OrgBackupData = Awaited<ReturnType<typeof getOrgBackupData>>;

export const BACKUP_FORMAT_VERSION = 1;

function decimalAwareReplacer(_key: string, value: unknown) {
  if (typeof value === "object" && value !== null && (value as { constructor?: { name?: string } }).constructor?.name === "Decimal") {
    return (value as { toString(): string }).toString();
  }
  return value;
}

export function serializeBackupJson(data: OrgBackupData) {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: BACKUP_FORMAT_VERSION,
    data,
  };
  return JSON.stringify(backup, decimalAwareReplacer, 2);
}

export function backupFilename(extension: string) {
  return `advocate-billing-backup-${new Date().toISOString().slice(0, 10)}.${extension}`;
}
