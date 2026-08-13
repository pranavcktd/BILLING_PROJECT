import { invoiceStatusWarning } from "@/lib/invoice-status";

export function quotationStatusWarning(
  currentStatus: string,
  newStatus: string,
  hasContract: boolean
): string | null {
  if (currentStatus === newStatus) return null;
  if (currentStatus === "ACCEPTED" && hasContract) {
    return "This quotation was accepted and a contract was already created from it. Change its status anyway?";
  }
  if (currentStatus === "ACCEPTED") {
    return "This quotation is already marked Accepted. Change its status anyway?";
  }
  return null;
}

export function contractStatusWarning(
  currentStatus: string,
  newStatus: string,
  invoiceCount: number
): string | null {
  if (currentStatus === newStatus) return null;
  if (currentStatus === "SIGNED" && invoiceCount > 0) {
    return `This contract is already signed and has ${invoiceCount} invoice(s) linked to it. Change its status anyway?`;
  }
  if (currentStatus === "SIGNED") {
    return "This contract is already signed. Change its status anyway?";
  }
  return null;
}

export { invoiceStatusWarning };
