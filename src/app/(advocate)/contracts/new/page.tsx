import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { createContract } from "@/lib/actions/contracts";
import { ContractForm } from "@/components/contract-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await requireAdvocate();
  const { clientId } = await searchParams;

  const [clients, matters] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.matter.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, clientId: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">New Contract</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm
            action={createContract}
            clients={clients}
            matters={matters}
            defaultValues={clientId ? { clientId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
