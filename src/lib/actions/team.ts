"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { DEFAULT_PASSWORD } from "@/lib/default-password";
import { MODULES, type PermissionLevel } from "@/lib/permissions";

// User sits outside the tenant-scoping extension by design, so every
// action here must explicitly verify the target belongs to the calling
// Advocate's own organization — otherwise an Advocate could act on another
// organization's staff member by guessing their id.
async function requireOwnStaffMember(userId: string, organizationId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== "STAFF" || user.organizationId !== organizationId) {
    throw new Error("Team member not found.");
  }
  return user;
}

const inviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
});

export async function inviteTeamMember(formData: FormData) {
  const session = await requireAdvocate();
  const parsed = inviteSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  const email = parsed.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`A login already exists for ${email}.`);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.name,
      role: "STAFF",
      organizationId: session.user.organizationId!,
      mustChangePassword: true,
      permissions: {},
    },
  });

  revalidatePath("/settings/team");
}

export async function updateTeamMemberPermissions(userId: string, formData: FormData) {
  const session = await requireAdvocate();
  await requireOwnStaffMember(userId, session.user.organizationId!);

  // Each module has two independent checkboxes; Manage implies View
  // regardless of whether the View box was also checked.
  const permissions: Partial<Record<(typeof MODULES)[number], PermissionLevel>> = {};
  for (const module of MODULES) {
    const canManage = formData.get(`${module}_manage`) === "on";
    const canView = formData.get(`${module}_view`) === "on";
    permissions[module] = canManage ? "MANAGE" : canView ? "VIEW" : "NONE";
  }

  await prisma.user.update({ where: { id: userId }, data: { permissions } });
  revalidatePath("/settings/team");
}

export async function setTeamMemberActive(userId: string, isActive: boolean) {
  const session = await requireAdvocate();
  await requireOwnStaffMember(userId, session.user.organizationId!);
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/settings/team");
}

export async function deleteTeamMember(userId: string) {
  const session = await requireAdvocate();
  await requireOwnStaffMember(userId, session.user.organizationId!);
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/settings/team");
}

export async function resetTeamMemberPassword(userId: string) {
  const session = await requireAdvocate();
  await requireOwnStaffMember(userId, session.user.organizationId!);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });
  revalidatePath("/settings/team");
}
