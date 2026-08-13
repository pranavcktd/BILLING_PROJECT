"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireAdvocate } from "@/lib/auth-guard";

const PAYMENT_METHODS = ["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "OTHER"] as const;

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.string().min(1, "Amount is required"),
  method: z.enum(PAYMENT_METHODS),
  bankAccountId: z.string().optional(),
  paidOn: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

async function recomputeInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true },
  });

  const amountPaid = invoice.payments.reduce(
    (sum, p) => sum.plus(p.amount),
    new Prisma.Decimal(0)
  );

  let status = invoice.status;
  if (status !== "CANCELLED" && status !== "DRAFT") {
    if (invoice.total.greaterThan(0) && amountPaid.greaterThanOrEqualTo(invoice.total)) {
      status = "PAID";
    } else if (amountPaid.greaterThan(0)) {
      status = "PARTIALLY_PAID";
    } else {
      status = "SENT";
    }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid, status },
  });
}

export async function recordPayment(formData: FormData) {
  await requireAdvocate();
  const parsed = paymentSchema.parse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    bankAccountId: formData.get("bankAccountId") || undefined,
    paidOn: formData.get("paidOn") || undefined,
    referenceNumber: formData.get("referenceNumber") || "",
    notes: formData.get("notes") || "",
  });

  const amount = parseFloat(parsed.amount);
  if (!(amount > 0)) {
    throw new Error("Amount must be greater than zero.");
  }

  await prisma.payment.create({
    data: {
      invoiceId: parsed.invoiceId,
      amount,
      method: parsed.method,
      bankAccountId: parsed.method === "BANK_TRANSFER" ? parsed.bankAccountId || null : null,
      paidOn: parsed.paidOn ? new Date(parsed.paidOn) : new Date(),
      referenceNumber: parsed.referenceNumber || null,
      notes: parsed.notes || null,
    },
  });

  await recomputeInvoice(parsed.invoiceId);

  revalidatePath(`/invoices/${parsed.invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/payments");
  redirect(`/invoices/${parsed.invoiceId}`);
}

export async function updatePayment(id: string, formData: FormData) {
  await requireAdvocate();
  const parsed = paymentSchema.omit({ invoiceId: true }).parse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    bankAccountId: formData.get("bankAccountId") || undefined,
    paidOn: formData.get("paidOn") || undefined,
    referenceNumber: formData.get("referenceNumber") || "",
    notes: formData.get("notes") || "",
  });

  const amount = parseFloat(parsed.amount);
  if (!(amount > 0)) {
    throw new Error("Amount must be greater than zero.");
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      amount,
      method: parsed.method,
      bankAccountId: parsed.method === "BANK_TRANSFER" ? parsed.bankAccountId || null : null,
      paidOn: parsed.paidOn ? new Date(parsed.paidOn) : new Date(),
      referenceNumber: parsed.referenceNumber || null,
      notes: parsed.notes || null,
    },
  });

  await recomputeInvoice(payment.invoiceId);

  revalidatePath(`/invoices/${payment.invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/payments");
  redirect(`/invoices/${payment.invoiceId}`);
}

export async function deletePayment(id: string) {
  await requireAdvocate();
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id } });
  await prisma.payment.delete({ where: { id } });
  await recomputeInvoice(payment.invoiceId);

  revalidatePath(`/invoices/${payment.invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/payments");
  redirect(`/invoices/${payment.invoiceId}`);
}
