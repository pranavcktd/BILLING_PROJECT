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

const organizationDetailsSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  profession: z.string().optional(),
  subscriptionStartDate: z.string().optional(),
  subscriptionEndDate: z.string().optional(),
});

export async function updateOrganizationDetails(organizationId: string, formData: FormData) {
  await requireSuperAdmin();
  const parsed = organizationDetailsSchema.parse({
    name: formData.get("name"),
    profession: formData.get("profession") || "",
    subscriptionStartDate: formData.get("subscriptionStartDate") || "",
    subscriptionEndDate: formData.get("subscriptionEndDate") || "",
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      name: parsed.name,
      profession: parsed.profession || null,
      subscriptionStartDate: parsed.subscriptionStartDate
        ? new Date(parsed.subscriptionStartDate)
        : null,
      subscriptionEndDate: parsed.subscriptionEndDate ? new Date(parsed.subscriptionEndDate) : null,
    },
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/organizations/${organizationId}`);
}

const userEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
});

export async function updateAdminUser(userId: string, formData: FormData) {
  await requireSuperAdmin();
  const parsed = userEditSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  const email = parsed.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new Error(`A login already exists for ${email}.`);
  }

  const orgId = (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).organizationId;
  await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.name, email },
  });

  revalidatePath("/super-admin");
  if (orgId) revalidatePath(`/super-admin/organizations/${orgId}`);
}

export async function setUserActive(userId: string, isActive: boolean) {
  await requireSuperAdmin();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
  revalidatePath("/super-admin");
  if (user.organizationId) revalidatePath(`/super-admin/organizations/${user.organizationId}`);
}

export async function deleteUser(userId: string) {
  await requireSuperAdmin();
  const user = await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/super-admin");
  if (user.organizationId) revalidatePath(`/super-admin/organizations/${user.organizationId}`);
}

const systemEmailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().optional(),
});

export async function updateSystemEmailSettings(formData: FormData) {
  await requireSuperAdmin();
  const parsed = systemEmailSettingsSchema.parse({
    smtpHost: formData.get("smtpHost") || "",
    smtpPort: formData.get("smtpPort") || undefined,
    smtpUser: formData.get("smtpUser") || "",
    smtpPass: formData.get("smtpPass") || "",
    fromName: formData.get("fromName") || "",
    fromEmail: formData.get("fromEmail") || "",
  });

  const existing = await prisma.systemEmailSettings.findFirst();
  const data = {
    smtpHost: parsed.smtpHost || null,
    smtpPort: parsed.smtpPort ?? null,
    smtpUser: parsed.smtpUser || null,
    smtpPass: parsed.smtpPass || existing?.smtpPass || null,
    fromName: parsed.fromName || null,
    fromEmail: parsed.fromEmail || null,
  };

  if (existing) {
    await prisma.systemEmailSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.systemEmailSettings.create({ data });
  }

  revalidatePath("/super-admin/settings");
}
