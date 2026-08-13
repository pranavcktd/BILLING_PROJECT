import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { toCsv, csvResponse } from "@/lib/csv";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";

export async function GET() {
  await requireAdvocate();
  const invoices = await prisma.invoice.findMany({
    orderBy: { issueDate: "desc" },
    include: { client: true, matter: true },
  });

  const csv = toCsv(invoices, [
    { key: "number", header: "Number" },
    { header: "Client", value: (r) => r.client.name },
    { header: "Matter", value: (r) => r.matter?.title ?? "" },
    { header: "Status", value: (r) => invoiceStatusLabel(displayInvoiceStatus(r)) },
    { header: "Issued", value: (r) => r.issueDate.toLocaleDateString() },
    { header: "Due", value: (r) => r.dueDate?.toLocaleDateString() ?? "" },
    { header: "Subtotal", value: (r) => r.subtotal.toFixed(2) },
    { header: "Total", value: (r) => r.total.toFixed(2) },
    { header: "Amount Paid", value: (r) => r.amountPaid.toFixed(2) },
    { header: "Balance", value: (r) => r.total.minus(r.amountPaid).toFixed(2) },
  ]);

  return csvResponse(csv, "invoices.csv");
}
