import type { OrgBackupData } from "@/lib/backup";

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "object" && (value as { constructor?: { name?: string } }).constructor?.name === "Decimal") {
    return (value as { toString(): string }).toString();
  }
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertStatements(table: string, rows: Record<string, unknown>[] | null | undefined): string {
  const records = rows ? (Array.isArray(rows) ? rows : [rows]) : [];
  if (records.length === 0) return `-- No rows for "${table}"\n`;

  const columns = Object.keys(records[0]);
  const columnList = columns.map((c) => `"${c}"`).join(", ");
  const lines = records.map((record) => {
    const values = columns.map((c) => sqlLiteral(record[c])).join(", ");
    return `INSERT INTO "${table}" (${columnList}) VALUES (${values});`;
  });
  return `-- ${table} (${records.length} rows)\n${lines.join("\n")}\n`;
}

// Table order matches the restore insert order (parents before children) so
// this file can also be read/executed top-to-bottom by a human if needed.
export function buildBackupSql(data: OrgBackupData): string {
  const sections = [
    `-- Advocate Billing data export — generated ${new Date().toISOString()}`,
    `-- Column/table names are case-sensitive; keep the double quotes when running this.`,
    "",
    insertStatements("FirmProfile", data.firmProfile ? [data.firmProfile] : []),
    insertStatements("EmailSettings", data.emailSettings ? [data.emailSettings] : []),
    insertStatements("ServiceItem", data.serviceItems),
    insertStatements("Expense", data.expenses),
    insertStatements("BankAccount", data.bankAccounts),
    insertStatements("Client", data.clients),
    insertStatements("Matter", data.matters),
    insertStatements("Quotation", data.quotations),
    insertStatements("QuotationItem", data.quotationItems),
    insertStatements("Contract", data.contracts),
    insertStatements("Invoice", data.invoices),
    insertStatements("InvoiceItem", data.invoiceItems),
    insertStatements("InvoiceBankAccount", data.invoiceBankAccounts),
    insertStatements("Payment", data.payments),
    insertStatements("ClientNote", data.clientNotes),
    insertStatements("User", data.users),
  ];
  return sections.join("\n");
}
