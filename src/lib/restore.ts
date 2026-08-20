import { z } from "zod";
import { prismaUnscoped } from "@/lib/prisma";
import { getOrgBackupData, serializeBackupJson, backupFilename, BACKUP_FORMAT_VERSION } from "@/lib/backup";

type Mailer = { transporter: { sendMail: (opts: Record<string, unknown>) => Promise<unknown> }; from: string | undefined };

const backupFileSchema = z.object({
  version: z.number(),
  exportedAt: z.string().optional(),
  data: z.object({
    clients: z.array(z.record(z.string(), z.unknown())).default([]),
    matters: z.array(z.record(z.string(), z.unknown())).default([]),
    quotations: z.array(z.record(z.string(), z.unknown())).default([]),
    quotationItems: z.array(z.record(z.string(), z.unknown())).default([]),
    contracts: z.array(z.record(z.string(), z.unknown())).default([]),
    invoices: z.array(z.record(z.string(), z.unknown())).default([]),
    invoiceItems: z.array(z.record(z.string(), z.unknown())).default([]),
    invoiceBankAccounts: z.array(z.record(z.string(), z.unknown())).default([]),
    payments: z.array(z.record(z.string(), z.unknown())).default([]),
    bankAccounts: z.array(z.record(z.string(), z.unknown())).default([]),
    serviceItems: z.array(z.record(z.string(), z.unknown())).default([]),
    expenses: z.array(z.record(z.string(), z.unknown())).default([]),
    firmProfile: z.record(z.string(), z.unknown()).nullable().optional(),
    emailSettings: z.record(z.string(), z.unknown()).nullable().optional(),
    clientNotes: z.array(z.record(z.string(), z.unknown())).default([]),
    // users intentionally not validated/used — restore never touches User.
  }),
});

export type ParsedBackupFile = z.infer<typeof backupFileSchema>;

export function parseBackupFile(raw: string): ParsedBackupFile {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const parsed = backupFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("That file doesn't look like a valid backup export.");
  }
  if (parsed.data.version !== BACKUP_FORMAT_VERSION) {
    throw new Error(`Unsupported backup version (${parsed.data.version}). Expected ${BACKUP_FORMAT_VERSION}.`);
  }
  return parsed.data;
}

// Strips relation/type fields that aren't real scalar columns and forces
// organizationId — defends against a stale export or a wrong-org upload.
function forOrg<T extends Record<string, unknown>>(rows: T[], organizationId: string) {
  return rows.map((row) => ({ ...row, organizationId }));
}

export async function performOrgRestore(
  organizationId: string,
  backup: ParsedBackupFile,
  mailer: Mailer | null,
  notifyEmail: string
) {
  if (!mailer) {
    throw new Error(
      "Restore was cancelled: no SMTP is configured, so a pre-restore safety backup could not be emailed. Configure email settings first."
    );
  }

  // 1. Mandatory pre-restore safety backup, sent BEFORE any destructive
  // action. If this fails, abort — the whole point is a rollback artifact.
  const preRestoreData = await getOrgBackupData(organizationId);
  const preRestoreJson = serializeBackupJson(preRestoreData);
  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: notifyEmail,
      subject: "Pre-restore safety backup",
      text: "A restore was just initiated for your organization. Attached is a full backup of your data exactly as it was immediately before the restore, in case you need to roll back.",
      attachments: [{ filename: backupFilename("json"), content: preRestoreJson }],
    });
  } catch (err) {
    throw new Error(
      `Restore was cancelled: the pre-restore safety backup email failed to send (${err instanceof Error ? err.message : "unknown error"}). No data was changed.`
    );
  }

  // 2. Wipe + reload, in one transaction. Uses the unscoped client with an
  // explicitly-passed organizationId — this must work even for a Super
  // Admin session that has no organizationId of its own, and skips the
  // tenant-scoping extension's per-row FK-ownership overhead since this
  // data is the org's own prior export being reloaded into the same org.
  await prismaUnscoped.$transaction(
    async (tx) => {
      // Delete pass: children before parents.
      await tx.payment.deleteMany({ where: { organizationId } });
      await tx.invoiceBankAccount.deleteMany({ where: { invoice: { organizationId } } });
      await tx.invoiceItem.deleteMany({ where: { invoice: { organizationId } } });
      await tx.invoice.deleteMany({ where: { organizationId } });
      await tx.contract.deleteMany({ where: { organizationId } });
      await tx.quotationItem.deleteMany({ where: { quotation: { organizationId } } });
      await tx.quotation.deleteMany({ where: { organizationId } });
      await tx.clientNote.deleteMany({ where: { organizationId } });
      await tx.matter.deleteMany({ where: { organizationId } });
      await tx.client.deleteMany({ where: { organizationId } });
      await tx.bankAccount.deleteMany({ where: { organizationId } });
      await tx.serviceItem.deleteMany({ where: { organizationId } });
      await tx.expense.deleteMany({ where: { organizationId } });
      await tx.firmProfile.deleteMany({ where: { organizationId } });
      await tx.emailSettings.deleteMany({ where: { organizationId } });

      const d = backup.data;

      // Insert pass: parents before children.
      if (d.firmProfile) {
        await tx.firmProfile.create({ data: forOrg([d.firmProfile], organizationId)[0] as never });
      }
      if (d.emailSettings) {
        // smtpPass was never in the backup (excluded at export time) — the
        // org re-enters it after a restore.
        await tx.emailSettings.create({
          data: { ...forOrg([d.emailSettings], organizationId)[0], smtpPass: null } as never,
        });
      }
      if (d.serviceItems.length) await tx.serviceItem.createMany({ data: forOrg(d.serviceItems, organizationId) as never });
      if (d.expenses.length) await tx.expense.createMany({ data: forOrg(d.expenses, organizationId) as never });
      if (d.bankAccounts.length) await tx.bankAccount.createMany({ data: forOrg(d.bankAccounts, organizationId) as never });
      if (d.clients.length) await tx.client.createMany({ data: forOrg(d.clients, organizationId) as never });
      if (d.matters.length) await tx.matter.createMany({ data: forOrg(d.matters, organizationId) as never });
      if (d.quotations.length) await tx.quotation.createMany({ data: forOrg(d.quotations, organizationId) as never });
      if (d.quotationItems.length) await tx.quotationItem.createMany({ data: d.quotationItems as never });
      if (d.contracts.length) await tx.contract.createMany({ data: forOrg(d.contracts, organizationId) as never });
      if (d.invoices.length) await tx.invoice.createMany({ data: forOrg(d.invoices, organizationId) as never });
      if (d.invoiceItems.length) await tx.invoiceItem.createMany({ data: d.invoiceItems as never });
      if (d.invoiceBankAccounts.length)
        await tx.invoiceBankAccount.createMany({ data: d.invoiceBankAccounts as never });
      if (d.payments.length) await tx.payment.createMany({ data: forOrg(d.payments, organizationId) as never });
      if (d.clientNotes.length) await tx.clientNote.createMany({ data: forOrg(d.clientNotes, organizationId) as never });
    },
    { timeout: 120_000, maxWait: 10_000 }
  );
}
