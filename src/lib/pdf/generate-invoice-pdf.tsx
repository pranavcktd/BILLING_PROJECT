import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getFirmProfile } from "@/lib/firm-profile";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";

export async function generateInvoicePdfBuffer(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      matter: true,
      bankAccounts: { include: { bankAccount: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice) return null;

  const firm = await getFirmProfile();

  let banks = invoice.bankAccounts.map((link) => ({
    bankName: link.bankAccount.bankName,
    accountName: link.bankAccount.accountName,
    accountNumber: link.bankAccount.accountNumber,
    ifscCode: link.bankAccount.ifscCode,
    branch: link.bankAccount.branch,
    isPrimary: link.isPrimary,
  }));

  if (banks.length === 0) {
    const defaultBank = await prisma.bankAccount.findFirst({ where: { isDefault: true } });
    if (defaultBank) {
      banks = [
        {
          bankName: defaultBank.bankName,
          accountName: defaultBank.accountName,
          accountNumber: defaultBank.accountNumber,
          ifscCode: defaultBank.ifscCode,
          branch: defaultBank.branch,
          isPrimary: true,
        },
      ];
    }
  }

  const balanceDue = invoice.total.minus(invoice.amountPaid);

  const buffer = await renderToBuffer(
    <InvoicePdf
      number={invoice.number}
      issueDate={invoice.issueDate.toLocaleDateString("en-IN")}
      dueDate={invoice.dueDate?.toLocaleDateString("en-IN") ?? null}
      status={invoiceStatusLabel(displayInvoiceStatus(invoice))}
      firm={{
        name: firm.name,
        address: firm.address,
        phone: firm.phone,
        email: firm.email,
        website: firm.website,
        gstin: firm.gstin,
      }}
      banks={banks}
      signatureImage={firm.signatureImage}
      client={{
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address,
        gstin: invoice.client.gstin,
      }}
      matter={invoice.matter ? { title: invoice.matter.title } : null}
      items={invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity.toFixed(2),
        rate: item.rate.toFixed(2),
        amount: item.amount.toFixed(2),
      }))}
      subtotal={invoice.subtotal.toFixed(2)}
      gstEnabled={invoice.gstEnabled}
      cgst={invoice.cgst.toFixed(2)}
      sgst={invoice.sgst.toFixed(2)}
      igst={invoice.igst.toFixed(2)}
      total={invoice.total.toFixed(2)}
      amountPaid={invoice.amountPaid.toFixed(2)}
      balanceDue={balanceDue.toFixed(2)}
      notes={invoice.notes}
    />
  );

  return { buffer, invoice, firm };
}
