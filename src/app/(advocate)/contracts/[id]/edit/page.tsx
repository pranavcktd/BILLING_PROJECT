import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { updateContract } from "@/lib/actions/contracts";
import { ContractForm } from "@/components/contract-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdvocate();
  const { id } = await params;

  const [contract, clients, matters] = await Promise.all([
    prisma.contract.findUnique({ where: { id } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.matter.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, clientId: true },
    }),
  ]);

  if (!contract) notFound();

  const updateContractWithId = updateContract.bind(null, contract.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Contract</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm
            action={updateContractWithId}
            clients={clients}
            matters={matters}
            submitLabel="Save Changes"
            defaultValues={{
              clientId: contract.clientId,
              matterId: contract.matterId ?? undefined,
              title: contract.title,
              content: contract.content,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
