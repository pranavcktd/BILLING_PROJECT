"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

function readForm(formData: FormData) {
  return expenseSchema.parse({
    date: formData.get("date"),
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    vendor: formData.get("vendor") || "",
    notes: formData.get("notes") || "",
  });
}

export async function createExpense(formData: FormData) {
  await requireModulePermission("expenses", "MANAGE");
  const parsed = readForm(formData);
  const amount = parseFloat(parsed.amount);
  if (!(amount > 0)) {
    throw new Error("Amount must be greater than zero.");
  }

  await prisma.expense.create({
    // @ts-expect-error organizationId is injected by the tenant-scoping Prisma extension (src/lib/prisma.ts)
    data: {
      date: new Date(parsed.date),
      category: parsed.category,
      description: parsed.description,
      amount,
      vendor: parsed.vendor || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function updateExpense(id: string, formData: FormData) {
  await requireModulePermission("expenses", "MANAGE");
  const parsed = readForm(formData);
  const amount = parseFloat(parsed.amount);
  if (!(amount > 0)) {
    throw new Error("Amount must be greater than zero.");
  }

  await prisma.expense.update({
    where: { id },
    data: {
      date: new Date(parsed.date),
      category: parsed.category,
      description: parsed.description,
      amount,
      vendor: parsed.vendor || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpense(id: string) {
  await requireModulePermission("expenses", "MANAGE");
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
}
