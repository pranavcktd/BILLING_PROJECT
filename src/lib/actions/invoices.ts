"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { nextInvoiceNumber } from "@/lib/numbering";
import { parseLineItems } from "@/lib/parse-line-items";
import { generateInvoicePdfBuffer } from "@/lib/pdf/generate-invoice-pdf";
import { getMailer } from "@/lib/mailer";

const INVOICE_STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "CANCELLED"] as const;

const metaSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  matterId: z.string().optional(),
  contractId: z.string().optional(),
  dueDate: z.string().optional(),
  gstEnabled: z.string().optional(),
  cgstPercent: z.string().optional(),
  sgstPercent: z.string().optional(),
  igstPercent: z.string().optional(),
  notes: z.string().optional(),
});

function readMeta(formData: FormData) {
  return metaSchema.parse({
    clientId: formData.get("clientId"),
    matterId: formData.get("matterId") || undefined,
    contractId: formData.get("contractId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    gstEnabled: formData.get("gstEnabled") || undefined,
    cgstPercent: formData.get("cgstPercent") || "0",
    sgstPercent: formData.get("sgstPercent") || "0",
    igstPercent: formData.get("igstPercent") || "0",
    notes: formData.get("notes") || "",
  });
}

function readBankSelection(formData: FormData) {
  const bankAccountIds = (formData.getAll("bankAccountIds") as string[]).filter(Boolean);
  const primaryBankAccountIdRaw = formData.get("primaryBankAccountId");
  const primaryBankAccountId =
    typeof primaryBankAccountIdRaw === "string" && bankAccountIds.includes(primaryBankAccountIdRaw)
      ? primaryBankAccountIdRaw
      : bankAccountIds[0];

  return bankAccountIds.map((bankAccountId) => ({
    bankAccountId,
    isPrimary: bankAccountId === primaryBankAccountId,
  }));
}

function computeGst(subtotal: number, meta: ReturnType<typeof readMeta>) {
  const gstEnabled = meta.gstEnabled === "on";
  if (!gstEnabled) {
    return { gstEnabled: false, cgst: 0, sgst: 0, igst: 0 };
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const cgst = round2((subtotal * (parseFloat(meta.cgstPercent || "0") || 0)) / 100);
  const sgst = round2((subtotal * (parseFloat(meta.sgstPercent || "0") || 0)) / 100);
  const igst = round2((subtotal * (parseFloat(meta.igstPercent || "0") || 0)) / 100);
  return { gstEnabled: true, cgst, sgst, igst };
}

export async function createInvoice(formData: FormData) {
  await requireModulePermission("invoices", "MANAGE");
  const meta = readMeta(formData);
  const { items, subtotal } = parseLineItems(formData);
  const bankSelection = readBankSelection(formData);

  if (items.length === 0) {
    throw new Error("Add at least one line item.");
  }

  const { gstEnabled, cgst, sgst, igst } = computeGst(subtotal, meta);
  const total = Math.round((subtotal + cgst + sgst + igst) * 100) / 100;
  const number = await nextInvoiceNumber();

  const invoice = await prisma.invoice.create({
    // @ts-expect-error organizationId is injected by the tenant-scoping Prisma extension (src/lib/prisma.ts)
    data: {
      number,
      clientId: meta.clientId,
      matterId: meta.matterId || null,
      contractId: meta.contractId || null,
      dueDate: meta.dueDate ? new Date(meta.dueDate) : null,
      subtotal,
      gstEnabled,
      cgst,
      sgst,
      igst,
      total,
      notes: meta.notes || null,
      items: {
        create: items.map((item, i) => ({ ...item, sortOrder: i })),
      },
      bankAccounts: {
        create: bankSelection,
      },
    },
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  await requireModulePermission("invoices", "MANAGE");
  const meta = readMeta(formData);
  const { items, subtotal } = parseLineItems(formData);
  const bankSelection = readBankSelection(formData);

  if (items.length === 0) {
    throw new Error("Add at least one line item.");
  }

  const { gstEnabled, cgst, sgst, igst } = computeGst(subtotal, meta);
  const total = Math.round((subtotal + cgst + sgst + igst) * 100) / 100;

  await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
  await prisma.invoiceBankAccount.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.update({
    where: { id },
    data: {
      clientId: meta.clientId,
      matterId: meta.matterId || null,
      contractId: meta.contractId || null,
      dueDate: meta.dueDate ? new Date(meta.dueDate) : null,
      subtotal,
      gstEnabled,
      cgst,
      sgst,
      igst,
      total,
      notes: meta.notes || null,
      items: {
        create: items.map((item, i) => ({ ...item, sortOrder: i })),
      },
      bankAccounts: {
        create: bankSelection,
      },
    },
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  await requireModulePermission("invoices", "MANAGE");
  try {
    await prisma.invoice.delete({ where: { id } });
  } catch {
    redirect(`/invoices/${id}?error=has-records`);
  }
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function setInvoiceStatus(id: string, status: string) {
  await requireModulePermission("invoices", "MANAGE");
  if (!INVOICE_STATUSES.includes(status as (typeof INVOICE_STATUSES)[number])) {
    throw new Error("Invalid status");
  }
  await prisma.invoice.update({
    where: { id },
    data: { status: status as (typeof INVOICE_STATUSES)[number] },
  });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function updateInvoiceStatusForm(id: string, formData: FormData) {
  const status = formData.get("status");
  if (typeof status !== "string") {
    throw new Error("Invalid status");
  }
  await setInvoiceStatus(id, status);
}

export async function sendInvoiceEmail(id: string) {
  await requireModulePermission("invoices", "MANAGE");

  const mailer = await getMailer();
  if (!mailer) {
    throw new Error(
      "Email isn't set up yet. Add your SMTP details under Settings → Email Settings first."
    );
  }

  const result = await generateInvoicePdfBuffer(id);
  if (!result) {
    throw new Error("Invoice not found.");
  }
  const { buffer, invoice, firm } = result;

  if (!invoice.client.email) {
    throw new Error("This client has no email address on file.");
  }

  const filename = `${invoice.number.replace(/\//g, "-")}.pdf`;
  const firmName = firm.name || "your advocate";

  await mailer.transporter.sendMail({
    from: mailer.from,
    to: invoice.client.email,
    subject: `Invoice ${invoice.number} from ${firmName}`,
    text: `Dear ${invoice.client.name},\n\nPlease find attached invoice ${invoice.number} for ₹${invoice.total.toFixed(
      2
    )}.\n\nRegards,\n${firmName}`,
    attachments: [{ filename, content: Buffer.from(buffer), contentType: "application/pdf" }],
  });

  revalidatePath(`/invoices/${id}`);
}
