import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireAdvocate();
  const payments = await prisma.payment.findMany({
    orderBy: { paidOn: "desc" },
    include: { invoice: { include: { client: true } } },
  });

  const csv = toCsv(payments, [
    { header: "Date", value: (r) => r.paidOn.toLocaleDateString() },
    { header: "Invoice", value: (r) => r.invoice.number },
    { header: "Client", value: (r) => r.invoice.client.name },
    { key: "method", header: "Method" },
    { key: "referenceNumber", header: "Reference" },
    { header: "Amount", value: (r) => r.amount.toFixed(2) },
    { key: "notes", header: "Notes" },
  ]);

  return csvResponse(csv, "payments.csv");
}
