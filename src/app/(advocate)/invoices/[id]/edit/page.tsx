import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { updateInvoice } from "@/lib/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdvocate();
  const { id } = await params;

  const [invoice, clients, matters, contracts, bankAccounts, serviceItems] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        bankAccounts: true,
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.matter.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, clientId: true },
    }),
    prisma.contract.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, clientId: true },
    }),
    prisma.bankAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, bankName: true, accountNumber: true, isDefault: true },
    }),
    prisma.serviceItem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, rate: true, unit: true },
    }),
  ]);

  if (!invoice) notFound();

  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id);

  const cgstPercent = invoice.subtotal.isZero()
    ? "0"
    : invoice.cgst.dividedBy(invoice.subtotal).times(100).toFixed(2);
  const sgstPercent = invoice.subtotal.isZero()
    ? "0"
    : invoice.sgst.dividedBy(invoice.subtotal).times(100).toFixed(2);
  const igstPercent = invoice.subtotal.isZero()
    ? "0"
    : invoice.igst.dividedBy(invoice.subtotal).times(100).toFixed(2);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Invoice {invoice.number}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            action={updateInvoiceWithId}
            clients={clients}
            matters={matters}
            contracts={contracts}
            bankAccounts={bankAccounts}
            serviceItems={serviceItems.map((s) => ({
              id: s.id,
              name: s.name,
              rate: s.rate.toFixed(2),
              unit: s.unit,
            }))}
            submitLabel="Save Changes"
            defaultValues={{
              clientId: invoice.clientId,
              matterId: invoice.matterId ?? undefined,
              contractId: invoice.contractId ?? undefined,
              bankAccountIds: invoice.bankAccounts.map((b) => b.bankAccountId),
              primaryBankAccountId: invoice.bankAccounts.find((b) => b.isPrimary)?.bankAccountId,
              dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : undefined,
              gstEnabled: invoice.gstEnabled,
              cgstPercent,
              sgstPercent,
              igstPercent,
              notes: invoice.notes ?? undefined,
              items: invoice.items.map((item) => ({
                description: item.description,
                quantity: item.quantity.toString(),
                rate: item.rate.toString(),
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
