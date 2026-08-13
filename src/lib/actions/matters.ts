"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";

const matterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED", "ON_HOLD"]),
});

function readMatterForm(formData: FormData) {
  return matterSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    status: formData.get("status") || "OPEN",
  });
}

export async function createMatter(clientId: string, formData: FormData) {
  await requireAdvocate();
  const parsed = readMatterForm(formData);

  const matter = await prisma.matter.create({
    data: {
      clientId,
      title: parsed.title,
      description: parsed.description || null,
      status: parsed.status,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  redirect(`/matters/${matter.id}`);
}

export async function updateMatter(id: string, formData: FormData) {
  await requireAdvocate();
  const parsed = readMatterForm(formData);

  const matter = await prisma.matter.update({
    where: { id },
    data: {
      title: parsed.title,
      description: parsed.description || null,
      status: parsed.status,
    },
  });

  revalidatePath(`/matters/${id}`);
  revalidatePath(`/clients/${matter.clientId}`);
  redirect(`/matters/${id}`);
}

export async function deleteMatter(id: string) {
  await requireAdvocate();
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id } });

  try {
    await prisma.matter.delete({ where: { id } });
  } catch {
    redirect(`/matters/${id}?error=has-records`);
  }

  revalidatePath(`/clients/${matter.clientId}`);
  redirect(`/clients/${matter.clientId}`);
}
