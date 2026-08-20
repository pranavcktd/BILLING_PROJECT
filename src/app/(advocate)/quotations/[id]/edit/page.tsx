import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { updateQuotation } from "@/lib/actions/quotations";
import { QuotationForm } from "@/components/quotation-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePermission("quotations", "MANAGE");
  const { id } = await params;

  const [quotation, clients, matters, serviceItems] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.matter.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, clientId: true },
    }),
    prisma.serviceItem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, rate: true, unit: true },
    }),
  ]);

  if (!quotation) notFound();

  const updateQuotationWithId = updateQuotation.bind(null, quotation.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Quotation {quotation.number}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quotation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationForm
            action={updateQuotationWithId}
            clients={clients}
            matters={matters}
            serviceItems={serviceItems.map((s) => ({
              id: s.id,
              name: s.name,
              rate: s.rate.toFixed(2),
              unit: s.unit,
            }))}
            submitLabel="Save Changes"
            defaultValues={{
              clientId: quotation.clientId,
              matterId: quotation.matterId ?? undefined,
              validUntil: quotation.validUntil
                ? quotation.validUntil.toISOString().slice(0, 10)
                : undefined,
              taxAmount: quotation.taxAmount.toFixed(2),
              notes: quotation.notes ?? undefined,
              items: quotation.items.map((item) => ({
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
