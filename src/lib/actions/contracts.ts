"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";

const CONTRACT_STATUSES = ["DRAFT", "SENT", "SIGNED", "CANCELLED"] as const;

const metaSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  matterId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

function readMeta(formData: FormData) {
  return metaSchema.parse({
    clientId: formData.get("clientId"),
    matterId: formData.get("matterId") || undefined,
    title: formData.get("title"),
    content: formData.get("content"),
  });
}

export async function createContract(formData: FormData) {
  await requireAdvocate();
  const meta = readMeta(formData);

  const contract = await prisma.contract.create({
    // @ts-expect-error organizationId is injected by the tenant-scoping Prisma extension (src/lib/prisma.ts)
    data: {
      clientId: meta.clientId,
      matterId: meta.matterId || null,
      title: meta.title,
      content: meta.content,
      status: "DRAFT",
    },
  });

  revalidatePath("/contracts");
  redirect(`/contracts/${contract.id}`);
}

export async function updateContract(id: string, formData: FormData) {
  await requireAdvocate();
  const meta = readMeta(formData);

  await prisma.contract.update({
    where: { id },
    data: {
      clientId: meta.clientId,
      matterId: meta.matterId || null,
      title: meta.title,
      content: meta.content,
    },
  });

  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  redirect(`/contracts/${id}`);
}

export async function deleteContract(id: string) {
  await requireAdvocate();
  try {
    await prisma.contract.delete({ where: { id } });
  } catch {
    redirect(`/contracts/${id}?error=has-records`);
  }
  revalidatePath("/contracts");
  redirect("/contracts");
}

export async function setContractStatus(id: string, status: string) {
  await requireAdvocate();
  if (!CONTRACT_STATUSES.includes(status as (typeof CONTRACT_STATUSES)[number])) {
    throw new Error("Invalid status");
  }
  await prisma.contract.update({
    where: { id },
    data: {
      status: status as (typeof CONTRACT_STATUSES)[number],
      signedAt: status === "SIGNED" ? new Date() : undefined,
    },
  });
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
}

export async function updateContractStatusForm(id: string, formData: FormData) {
  const status = formData.get("status");
  if (typeof status !== "string") {
    throw new Error("Invalid status");
  }
  await setContractStatus(id, status);
}
