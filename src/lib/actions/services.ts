"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { parseCsv, csvRowsToObjects } from "@/lib/csv";
import type { BulkImportResult } from "@/lib/actions/clients";

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  rate: z.string().min(1, "Rate is required"),
  unit: z.string().optional(),
});

function readForm(formData: FormData) {
  return serviceSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    rate: formData.get("rate"),
    unit: formData.get("unit") || "",
  });
}

export async function createService(formData: FormData) {
  await requireAdvocate();
  const parsed = readForm(formData);
  const rate = parseFloat(parsed.rate);
  if (!(rate >= 0)) {
    throw new Error("Rate must be a valid non-negative number.");
  }

  await prisma.serviceItem.create({
    data: {
      name: parsed.name,
      description: parsed.description || null,
      rate,
      unit: parsed.unit || null,
    },
  });

  revalidatePath("/services");
  redirect("/services");
}

export async function updateService(id: string, formData: FormData) {
  await requireAdvocate();
  const parsed = readForm(formData);
  const rate = parseFloat(parsed.rate);
  if (!(rate >= 0)) {
    throw new Error("Rate must be a valid non-negative number.");
  }

  await prisma.serviceItem.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description || null,
      rate,
      unit: parsed.unit || null,
    },
  });

  revalidatePath("/services");
  redirect("/services");
}

export async function deleteService(id: string) {
  await requireAdvocate();
  await prisma.serviceItem.delete({ where: { id } });
  revalidatePath("/services");
}

export async function toggleServiceActive(id: string) {
  await requireAdvocate();
  const service = await prisma.serviceItem.findUniqueOrThrow({ where: { id } });
  await prisma.serviceItem.update({
    where: { id },
    data: { isActive: !service.isActive },
  });
  revalidatePath("/services");
}

export async function bulkImportServices(formData: FormData): Promise<BulkImportResult> {
  await requireAdvocate();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a CSV file to import.");
  }

  const text = await file.text();
  const rows = csvRowsToObjects(parseCsv(text));

  const result: BulkImportResult = { created: 0, skipped: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = r.name?.trim();
    if (!name) {
      result.skipped.push({ row: i + 2, reason: "Missing name" });
      continue;
    }
    const rate = parseFloat(r.rate);
    if (!(rate >= 0)) {
      result.skipped.push({ row: i + 2, reason: `Invalid rate: ${r.rate}` });
      continue;
    }
    try {
      await prisma.serviceItem.create({
        data: {
          name,
          description: r.description?.trim() || null,
          rate,
          unit: r.unit?.trim() || null,
        },
      });
      result.created++;
    } catch (err) {
      result.skipped.push({
        row: i + 2,
        reason: err instanceof Error ? err.message : "Failed to create",
      });
    }
  }

  revalidatePath("/services");
  return result;
}
