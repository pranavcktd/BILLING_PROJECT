import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";

export async function GET() {
  await requireAdvocate();

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
    clientNotes,
    users,
  ] = await Promise.all([
    prisma.client.findMany(),
    prisma.matter.findMany(),
    prisma.quotation.findMany(),
    prisma.quotationItem.findMany(),
    prisma.contract.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceItem.findMany(),
    prisma.invoiceBankAccount.findMany(),
    prisma.payment.findMany(),
    prisma.bankAccount.findMany(),
    prisma.serviceItem.findMany(),
    prisma.expense.findMany(),
    prisma.firmProfile.findUnique({ where: { id: "singleton" } }),
    prisma.clientNote.findMany(),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clientId: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash intentionally excluded from backups
      },
    }),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
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
      clientNotes,
      users,
    },
  };

  const json = JSON.stringify(
    backup,
    (_key, value) => (typeof value === "object" && value?.constructor?.name === "Decimal" ? value.toString() : value),
    2
  );

  const filename = `advocate-billing-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
