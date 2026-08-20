"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { DEFAULT_PASSWORD } from "@/lib/default-password";
import { getSystemMailer, buildMailer, sendTestEmail } from "@/lib/mailer";
import { parseBackupFile, performOrgRestore } from "@/lib/restore";
import { logActivity } from "@/lib/audit-log";

const onboardSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  profession: z.string().optional(),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Enter a valid email address"),
});

export async function onboardOrganization(formData: FormData) {
  const session = await requireSuperAdmin();
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

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Onboarded organization",
    targetType: "Organization",
    targetId: organization.id,
    targetLabel: organization.name,
    details: `Admin login: ${email}`,
  });

  revalidatePath("/super-admin");
  redirect("/super-admin");
}

export async function resetAdminPassword(userId: string) {
  const session = await requireSuperAdmin();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });
  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Reset admin password",
    targetType: "User",
    targetId: user.id,
    targetLabel: user.email,
  });
  revalidatePath("/super-admin");
}

export async function setOrganizationSubscriptionStatus(
  organizationId: string,
  status: "ACTIVE" | "SUSPENDED"
) {
  const session = await requireSuperAdmin();
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { subscriptionStatus: status },
  });
  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: status === "SUSPENDED" ? "Suspended organization" : "Reactivated organization",
    targetType: "Organization",
    targetId: org.id,
    targetLabel: org.name,
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
  const session = await requireSuperAdmin();
  const parsed = organizationDetailsSchema.parse({
    name: formData.get("name"),
    profession: formData.get("profession") || "",
    subscriptionStartDate: formData.get("subscriptionStartDate") || "",
    subscriptionEndDate: formData.get("subscriptionEndDate") || "",
  });

  const org = await prisma.organization.update({
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

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Updated organization details",
    targetType: "Organization",
    targetId: org.id,
    targetLabel: org.name,
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/organizations/${organizationId}`);
}

const userEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
});

export async function updateAdminUser(userId: string, formData: FormData) {
  const session = await requireSuperAdmin();
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

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Updated admin login details",
    targetType: "User",
    targetId: userId,
    targetLabel: email,
  });

  revalidatePath("/super-admin");
  if (orgId) revalidatePath(`/super-admin/organizations/${orgId}`);
}

export async function setUserActive(userId: string, isActive: boolean) {
  const session = await requireSuperAdmin();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: isActive ? "Reactivated user" : "Deactivated user",
    targetType: "User",
    targetId: user.id,
    targetLabel: user.email,
  });
  revalidatePath("/super-admin");
  if (user.organizationId) revalidatePath(`/super-admin/organizations/${user.organizationId}`);
}

export async function deleteUser(userId: string) {
  const session = await requireSuperAdmin();
  const user = await prisma.user.delete({ where: { id: userId } });
  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Deleted user",
    targetType: "User",
    targetId: user.id,
    targetLabel: user.email,
  });
  revalidatePath("/super-admin");
  if (user.organizationId) revalidatePath(`/super-admin/organizations/${user.organizationId}`);
}

export async function restoreOrganizationDataAsSuperAdmin(organizationId: string, formData: FormData) {
  const session = await requireSuperAdmin();
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    throw new Error("Organization not found.");
  }

  const file = formData.get("backupFile");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a backup JSON file to restore from.");
  }

  const raw = await file.text();
  const backup = parseBackupFile(raw);
  const mailer = await getSystemMailer();

  await performOrgRestore(organizationId, backup, mailer, session.user.email!);

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Restored organization data from backup",
    targetType: "Organization",
    targetId: organizationId,
    targetLabel: org.name,
  });

  revalidatePath("/super-admin");
  revalidatePath(`/super-admin/organizations/${organizationId}`);
}

const systemEmailSettingsSchema = z
  .object({
    smtpHost: z.string().optional(),
    smtpPort: z.coerce.number().optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().optional(),
  })
  .refine((data) => !data.smtpHost || (data.smtpPort && data.smtpUser), {
    message: "SMTP Port and Username are required when a host is set.",
    path: ["smtpPort"],
  });

function readSystemEmailSettingsForm(formData: FormData) {
  const result = systemEmailSettingsSchema.safeParse({
    smtpHost: formData.get("smtpHost") || "",
    smtpPort: formData.get("smtpPort") || undefined,
    smtpUser: formData.get("smtpUser") || "",
    smtpPass: formData.get("smtpPass") || "",
    fromName: formData.get("fromName") || "",
    fromEmail: formData.get("fromEmail") || "",
  });
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid email settings.");
  }
  return result.data;
}

export async function updateSystemEmailSettings(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = readSystemEmailSettingsForm(formData);

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

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Updated system email settings",
  });

  revalidatePath("/super-admin/settings");
}

export async function testSystemEmailSettings(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = readSystemEmailSettingsForm(formData);
  const testRecipient = String(formData.get("testRecipient") || "").trim() || session.user.email!;

  const existing = await prisma.systemEmailSettings.findFirst();
  const mailer = buildMailer({
    smtpHost: parsed.smtpHost || null,
    smtpPort: parsed.smtpPort ?? null,
    smtpUser: parsed.smtpUser || null,
    smtpPass: parsed.smtpPass || existing?.smtpPass || null,
    fromName: parsed.fromName || null,
    fromEmail: parsed.fromEmail || null,
  });

  if (!mailer) {
    throw new Error("Fill in SMTP Host, Port, Username, and Password before testing.");
  }

  await sendTestEmail(mailer, testRecipient);
  return testRecipient;
}

const inviteSuperAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
});

export async function inviteSuperAdmin(formData: FormData) {
  const session = await requireSuperAdmin();
  const parsed = inviteSuperAdminSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  const email = parsed.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`A login already exists for ${email}.`);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const newAdmin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.name,
      role: "SUPER_ADMIN",
      mustChangePassword: true,
    },
  });

  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Invited Super Admin",
    targetType: "User",
    targetId: newAdmin.id,
    targetLabel: newAdmin.email,
  });

  revalidatePath("/super-admin/team");
}

async function requireNotLastSuperAdmin(userId: string) {
  const activeSuperAdminCount = await prisma.user.count({
    where: { role: "SUPER_ADMIN", isActive: true, id: { not: userId } },
  });
  if (activeSuperAdminCount === 0) {
    throw new Error("Can't remove the last active Super Admin login.");
  }
}

export async function resetSuperAdminPassword(userId: string) {
  const session = await requireSuperAdmin();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });
  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Reset Super Admin password",
    targetType: "User",
    targetId: user.id,
    targetLabel: user.email,
  });
  revalidatePath("/super-admin/team");
}

export async function setSuperAdminActive(userId: string, isActive: boolean) {
  const session = await requireSuperAdmin();
  if (!isActive) {
    await requireNotLastSuperAdmin(userId);
  }
  const user = await prisma.user.update({ where: { id: userId }, data: { isActive } });
  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: isActive ? "Reactivated Super Admin" : "Deactivated Super Admin",
    targetType: "User",
    targetId: user.id,
    targetLabel: user.email,
  });
  revalidatePath("/super-admin/team");
}

export async function deleteSuperAdmin(userId: string) {
  const session = await requireSuperAdmin();
  await requireNotLastSuperAdmin(userId);
  const user = await prisma.user.delete({ where: { id: userId } });
  await logActivity({
    actorId: session.user.id,
    actorEmail: session.user.email!,
    action: "Deleted Super Admin",
    targetType: "User",
    targetId: user.id,
    targetLabel: user.email,
  });
  revalidatePath("/super-admin/team");
}
