import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { createQuotation } from "@/lib/actions/quotations";
import { QuotationForm } from "@/components/quotation-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await requireModulePermission("quotations", "MANAGE");
  const { clientId } = await searchParams;

  const [clients, matters, serviceItems] = await Promise.all([
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">New Quotation</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quotation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationForm
            action={createQuotation}
            clients={clients}
            matters={matters}
            serviceItems={serviceItems.map((s) => ({
              id: s.id,
              name: s.name,
              rate: s.rate.toFixed(2),
              unit: s.unit,
            }))}
            defaultValues={clientId ? { clientId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
