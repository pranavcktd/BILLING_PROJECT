import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireAdvocate();
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });

  const csv = toCsv(expenses, [
    { header: "Date", value: (r) => r.date.toLocaleDateString() },
    { key: "category", header: "Category" },
    { key: "description", header: "Description" },
    { key: "vendor", header: "Vendor" },
    { header: "Amount", value: (r) => r.amount.toFixed(2) },
    { key: "notes", header: "Notes" },
  ]);

  return csvResponse(csv, "expenses.csv");
}
