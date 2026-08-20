import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { createInvoice } from "@/lib/actions/invoices";
import { InvoiceForm } from "@/components/invoice-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; contractId?: string }>;
}) {
  await requireModulePermission("invoices", "MANAGE");
  const { clientId, contractId } = await searchParams;

  const [clients, matters, contracts, bankAccounts, serviceItems, prefillContract] =
    await Promise.all([
      prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.matter.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, clientId: true },
      }),
      prisma.contract.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, clientId: true, matterId: true },
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
      contractId
        ? prisma.contract.findUnique({
            where: { id: contractId },
            select: { id: true, clientId: true, matterId: true },
          })
        : Promise.resolve(null),
    ]);

  const defaultValues = prefillContract
    ? {
        clientId: prefillContract.clientId,
        matterId: prefillContract.matterId ?? undefined,
        contractId: prefillContract.id,
      }
    : clientId
    ? { clientId }
    : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">New Invoice</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            action={createInvoice}
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
            defaultValues={defaultValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}
