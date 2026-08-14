"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { DEFAULT_PASSWORD } from "@/lib/default-password";

const onboardSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  profession: z.string().optional(),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Enter a valid email address"),
});

export async function onboardOrganization(formData: FormData) {
  await requireSuperAdmin();
  const parsed = onboardSchema.parse({
    organizationName: formData.get("organizationName"),
    profession: formData.get("profession") || "",
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
  });

  const email = parsed.adminEmail.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`A login already exists for ${email}.`);
  }

  const organization = await prisma.organization.create({
    data: {
      name: parsed.organizationName,
      profession: parsed.profession || null,
    },
  });

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.adminName,
      role: "ADVOCATE",
      organizationId: organization.id,
      mustChangePassword: true,
    },
  });

  revalidatePath("/super-admin");
  redirect("/super-admin");
}

export async function resetAdminPassword(userId: string) {
  await requireSuperAdmin();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });
  revalidatePath("/super-admin");
}

export async function setOrganizationSubscriptionStatus(
  organizationId: string,
  status: "ACTIVE" | "SUSPENDED"
) {
  await requireSuperAdmin();
  await prisma.organization.update({
    where: { id: organizationId },
    data: { subscriptionStatus: status },
  });
  revalidatePath("/super-admin");
}
