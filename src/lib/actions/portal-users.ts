"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdvocate, requireClient } from "@/lib/auth-guard";
import { signOut } from "@/auth";

const DEFAULT_CLIENT_PASSWORD = "Client@123";

export async function createPortalUser(clientId: string) {
  await requireAdvocate();
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  if (!client.email) {
    throw new Error("Add an email address to this client's profile first.");
  }

  const passwordHash = await bcrypt.hash(DEFAULT_CLIENT_PASSWORD, 12);

  await prisma.user.create({
    data: {
      email: client.email.toLowerCase(),
      passwordHash,
      name: client.name,
      role: "CLIENT",
      clientId: client.id,
      mustChangePassword: true,
    },
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function resetPortalPassword(userId: string) {
  await requireAdvocate();
  const passwordHash = await bcrypt.hash(DEFAULT_CLIENT_PASSWORD, 12);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  if (user.clientId) {
    revalidatePath(`/clients/${user.clientId}`);
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

export async function changeOwnPassword(formData: FormData) {
  const session = await requireClient();
  const parsed = changePasswordSchema.parse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(parsed.currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(parsed.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  await signOut({ redirectTo: "/login?passwordChanged=1" });
}
