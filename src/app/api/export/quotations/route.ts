import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireAdvocate();
  const quotations = await prisma.quotation.findMany({
    orderBy: { issueDate: "desc" },
    include: { client: true, matter: true },
  });

  const csv = toCsv(quotations, [
    { key: "number", header: "Number" },
    { header: "Client", value: (r) => r.client.name },
    { header: "Matter", value: (r) => r.matter?.title ?? "" },
    { key: "status", header: "Status" },
    { header: "Issued", value: (r) => r.issueDate.toLocaleDateString() },
    { header: "Valid Until", value: (r) => r.validUntil?.toLocaleDateString() ?? "" },
    { header: "Subtotal", value: (r) => r.subtotal.toFixed(2) },
    { header: "Tax", value: (r) => r.taxAmount.toFixed(2) },
    { header: "Total", value: (r) => r.total.toFixed(2) },
  ]);

  return csvResponse(csv, "quotations.csv");
}
