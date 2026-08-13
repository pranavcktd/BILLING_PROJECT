export function displayInvoiceStatus(invoice: { status: string; dueDate: Date | null }) {
  const isOverdue =
    (invoice.status === "SENT" || invoice.status === "PARTIALLY_PAID") &&
    invoice.dueDate !== null &&
    invoice.dueDate.getTime() < Date.now();
  return isOverdue ? "OVERDUE" : invoice.status;
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent (Unpaid)",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export function invoiceStatusLabel(status: string) {
  return INVOICE_STATUS_LABELS[status] ?? status.replace("_", " ");
}

/**
 * Returns a confirmation message for status changes that could undo or
 * contradict work already done (payments recorded, already sent, etc),
 * or null if the change is routine and needs no extra confirmation.
 */
export function invoiceStatusWarning(
  currentStatus: string,
  newStatus: string,
  amountPaid: number
): string | null {
  if (currentStatus === newStatus) return null;

  if (currentStatus === "PAID" && newStatus !== "PAID") {
    return `This invoice is marked PAID (₹${amountPaid.toFixed(2)} collected). Changing its status will NOT reverse the recorded payments — you'd need to delete those separately. Continue?`;
  }
  if (currentStatus === "PARTIALLY_PAID" && (newStatus === "DRAFT" || newStatus === "CANCELLED")) {
    return `This invoice has ₹${amountPaid.toFixed(2)} in recorded payments. Changing its status will NOT reverse them. Continue?`;
  }
  if ((currentStatus === "SENT" || currentStatus === "PARTIALLY_PAID") && newStatus === "CANCELLED") {
    return "This invoice has already been sent to the client. Cancel it anyway?";
  }
  if (currentStatus === "CANCELLED" && newStatus !== "CANCELLED") {
    return "This invoice was cancelled. Reactivating it may be confusing if the client was already told it's void. Continue?";
  }
  return null;
}
