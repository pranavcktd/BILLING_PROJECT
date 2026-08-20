"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";

const clientNoteSchema = z.object({
  type: z.enum(["CREDIT", "DEBIT", "NOTE"]),
  amount: z.coerce.number().optional(),
  department: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
});

function readClientNoteForm(formData: FormData) {
  return clientNoteSchema.parse({
    type: formData.get("type") || "NOTE",
    amount: formData.get("amount") || undefined,
    department: formData.get("department") ?? "",
    description: formData.get("description"),
    date: formData.get("date"),
  });
}

export async function createClientNote(clientId: string, formData: FormData) {
  await requireModulePermission("clientNotes", "MANAGE");
  const parsed = readClientNoteForm(formData);

  await prisma.clientNote.create({
    // @ts-expect-error organizationId is injected by the tenant-scoping Prisma extension (src/lib/prisma.ts)
    data: {
      clientId,
      type: parsed.type,
      amount: parsed.type === "NOTE" ? null : parsed.amount ?? null,
      department: parsed.department || null,
      description: parsed.description,
      date: new Date(parsed.date),
    },
  });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}?tab=ledger`);
}

export async function updateClientNote(id: string, formData: FormData) {
  await requireModulePermission("clientNotes", "MANAGE");
  const parsed = readClientNoteForm(formData);
  const note = await prisma.clientNote.findUniqueOrThrow({ where: { id } });

  await prisma.clientNote.update({
    where: { id },
    data: {
      type: parsed.type,
      amount: parsed.type === "NOTE" ? null : parsed.amount ?? null,
      department: parsed.department || null,
      description: parsed.description,
      date: new Date(parsed.date),
    },
  });

  revalidatePath(`/clients/${note.clientId}`);
  redirect(`/clients/${note.clientId}?tab=ledger`);
}

export async function deleteClientNote(id: string) {
  await requireModulePermission("clientNotes", "MANAGE");
  const note = await prisma.clientNote.findUniqueOrThrow({ where: { id } });
  await prisma.clientNote.delete({ where: { id } });
  revalidatePath(`/clients/${note.clientId}`);
}
