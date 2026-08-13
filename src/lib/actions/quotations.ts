"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { nextQuotationNumber } from "@/lib/numbering";
import { parseLineItems } from "@/lib/parse-line-items";

const QUOTATION_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;

const metaSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  matterId: z.string().optional(),
  validUntil: z.string().optional(),
  taxAmount: z.string().optional(),
  notes: z.string().optional(),
});

function readMeta(formData: FormData) {
  return metaSchema.parse({
    clientId: formData.get("clientId"),
    matterId: formData.get("matterId") || undefined,
    validUntil: formData.get("validUntil") || undefined,
    taxAmount: formData.get("taxAmount") || "0",
    notes: formData.get("notes") || "",
  });
}

export async function createQuotation(formData: FormData) {
  await requireAdvocate();
  const meta = readMeta(formData);
  const { items, subtotal } = parseLineItems(formData);

  if (items.length === 0) {
    throw new Error("Add at least one line item.");
  }

  const taxAmount = parseFloat(meta.taxAmount || "0") || 0;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const number = await nextQuotationNumber();

  const quotation = await prisma.quotation.create({
    data: {
      number,
      clientId: meta.clientId,
      matterId: meta.matterId || null,
      validUntil: meta.validUntil ? new Date(meta.validUntil) : null,
      subtotal,
      taxAmount,
      total,
      notes: meta.notes || null,
      items: {
        create: items.map((item, i) => ({ ...item, sortOrder: i })),
      },
    },
  });

  revalidatePath("/quotations");
  redirect(`/quotations/${quotation.id}`);
}

export async function updateQuotation(id: string, formData: FormData) {
  await requireAdvocate();
  const meta = readMeta(formData);
  const { items, subtotal } = parseLineItems(formData);

  if (items.length === 0) {
    throw new Error("Add at least one line item.");
  }

  const taxAmount = parseFloat(meta.taxAmount || "0") || 0;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
  await prisma.quotation.update({
    where: { id },
    data: {
      clientId: meta.clientId,
      matterId: meta.matterId || null,
      validUntil: meta.validUntil ? new Date(meta.validUntil) : null,
      subtotal,
      taxAmount,
      total,
      notes: meta.notes || null,
      items: {
        create: items.map((item, i) => ({ ...item, sortOrder: i })),
      },
    },
  });

  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
  redirect(`/quotations/${id}`);
}

export async function deleteQuotation(id: string) {
  await requireAdvocate();
  try {
    await prisma.quotation.delete({ where: { id } });
  } catch {
    redirect(`/quotations/${id}?error=has-records`);
  }
  revalidatePath("/quotations");
  redirect("/quotations");
}

export async function setQuotationStatus(id: string, status: string) {
  await requireAdvocate();
  if (!QUOTATION_STATUSES.includes(status as (typeof QUOTATION_STATUSES)[number])) {
    throw new Error("Invalid status");
  }
  await prisma.quotation.update({
    where: { id },
    data: { status: status as (typeof QUOTATION_STATUSES)[number] },
  });
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
}

export async function updateQuotationStatusForm(id: string, formData: FormData) {
  const status = formData.get("status");
  if (typeof status !== "string") {
    throw new Error("Invalid status");
  }
  await setQuotationStatus(id, status);
}

function buildContractContent(quotation: {
  number: string;
  notes: string | null;
  items: { description: string; quantity: unknown; rate: unknown; amount: unknown }[];
  total: unknown;
}) {
  const lines = [
    `This engagement letter is issued with reference to Quotation ${quotation.number}.`,
    "",
    "Scope of services:",
    ...quotation.items.map(
      (item) => `- ${item.description} (Qty: ${item.quantity}, Rate: ${item.rate}, Amount: ${item.amount})`
    ),
    "",
    `Total fees: ${quotation.total}`,
  ];
  if (quotation.notes) {
    lines.push("", "Notes:", quotation.notes);
  }
  return lines.join("\n");
}

export async function convertQuotationToContract(quotationId: string) {
  await requireAdvocate();
  const quotation = await prisma.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: { items: true },
  });

  const contract = await prisma.contract.create({
    data: {
      clientId: quotation.clientId,
      matterId: quotation.matterId,
      quotationId: quotation.id,
      title: `Engagement Letter - ${quotation.number}`,
      content: buildContractContent(quotation),
      status: "DRAFT",
    },
  });

  await prisma.quotation.update({
    where: { id: quotationId },
    data: { status: "ACCEPTED" },
  });

  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath("/contracts");
  redirect(`/contracts/${contract.id}`);
}
