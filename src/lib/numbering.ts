import { prisma } from "@/lib/prisma";
import { financialYearLabel } from "@/lib/financial-year";

function currentFinancialYearLabel(date = new Date()) {
  return financialYearLabel(date);
}

export async function nextQuotationNumber() {
  const prefix = `QTN/${currentFinancialYearLabel()}/`;
  const count = await prisma.quotation.count({
    where: { number: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function nextInvoiceNumber() {
  const prefix = `INV/${currentFinancialYearLabel()}/`;
  const count = await prisma.invoice.count({
    where: { number: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}
