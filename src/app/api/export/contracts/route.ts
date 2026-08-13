import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireAdvocate();
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, matter: true },
  });

  const csv = toCsv(contracts, [
    { key: "title", header: "Title" },
    { header: "Client", value: (r) => r.client.name },
    { header: "Matter", value: (r) => r.matter?.title ?? "" },
    { key: "status", header: "Status" },
    { header: "Created", value: (r) => r.createdAt.toLocaleDateString() },
    { header: "Signed", value: (r) => r.signedAt?.toLocaleDateString() ?? "" },
  ]);

  return csvResponse(csv, "contracts.csv");
}
