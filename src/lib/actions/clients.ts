"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { parseCsv, csvRowsToObjects } from "@/lib/csv";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  tan: z.string().optional(),
  notes: z.string().optional(),
});

function readClientForm(formData: FormData) {
  return clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    gstin: formData.get("gstin") ?? "",
    tan: formData.get("tan") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

export async function createClient(formData: FormData) {
  await requireAdvocate();
  const parsed = readClientForm(formData);

  const client = await prisma.client.create({
    data: {
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      address: parsed.address || null,
      gstin: parsed.gstin || null,
      tan: parsed.tan || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  await requireAdvocate();
  const parsed = readClientForm(formData);

  await prisma.client.update({
    where: { id },
    data: {
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      address: parsed.address || null,
      gstin: parsed.gstin || null,
      tan: parsed.tan || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  await requireAdvocate();
  try {
    await prisma.client.delete({ where: { id } });
  } catch {
    redirect(`/clients/${id}?error=has-records`);
  }
  revalidatePath("/clients");
  redirect("/clients");
}

export type BulkImportResult = {
  created: number;
  skipped: { row: number; reason: string }[];
};

export async function bulkImportClients(formData: FormData): Promise<BulkImportResult> {
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
    const email = r.email?.trim() || null;
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      result.skipped.push({ row: i + 2, reason: `Invalid email: ${email}` });
      continue;
    }
    try {
      await prisma.client.create({
        data: {
          name,
          email,
          phone: r.phone?.trim() || null,
          address: r.address?.trim() || null,
          gstin: r.gstin?.trim() || null,
          tan: r.tan?.trim() || null,
          notes: r.notes?.trim() || null,
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

  revalidatePath("/clients");
  return result;
}
