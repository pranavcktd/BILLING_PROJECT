import ExcelJS from "exceljs";
import type { OrgBackupData } from "@/lib/backup";

function cellValue(value: unknown): ExcelJS.CellValue {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && (value as { constructor?: { name?: string } }).constructor?.name === "Decimal") {
    return Number((value as { toString(): string }).toString());
  }
  if (typeof value === "object") return JSON.stringify(value);
  return value as ExcelJS.CellValue;
}

function addSheet(workbook: ExcelJS.Workbook, name: string, rows: Record<string, unknown>[] | null | undefined) {
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  const records = rows ? (Array.isArray(rows) ? rows : [rows]) : [];
  if (records.length === 0) return;

  const columns = Object.keys(records[0]);
  sheet.columns = columns.map((key) => ({ header: key, key, width: 20 }));
  for (const record of records) {
    const row: Record<string, ExcelJS.CellValue> = {};
    for (const key of columns) {
      row[key] = cellValue(record[key]);
    }
    sheet.addRow(row);
  }
  sheet.getRow(1).font = { bold: true };
}

export async function buildBackupWorkbook(data: OrgBackupData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Advocate Billing";
  workbook.created = new Date();

  addSheet(workbook, "Clients", data.clients);
  addSheet(workbook, "Matters", data.matters);
  addSheet(workbook, "Quotations", data.quotations);
  addSheet(workbook, "QuotationItems", data.quotationItems);
  addSheet(workbook, "Contracts", data.contracts);
  addSheet(workbook, "Invoices", data.invoices);
  addSheet(workbook, "InvoiceItems", data.invoiceItems);
  addSheet(workbook, "InvoiceBankAccounts", data.invoiceBankAccounts);
  addSheet(workbook, "Payments", data.payments);
  addSheet(workbook, "BankAccounts", data.bankAccounts);
  addSheet(workbook, "ServiceItems", data.serviceItems);
  addSheet(workbook, "Expenses", data.expenses);
  if (data.firmProfile) addSheet(workbook, "FirmProfile", [data.firmProfile]);
  if (data.emailSettings) addSheet(workbook, "EmailSettings", [data.emailSettings]);
  addSheet(workbook, "ClientNotes", data.clientNotes);
  addSheet(workbook, "Users", data.users);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
