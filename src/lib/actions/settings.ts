"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";

const firmProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  gstin: z.string().optional(),
});

const MAX_SIGNATURE_BYTES = 500 * 1024;

export async function updateFirmProfile(formData: FormData) {
  await requireAdvocate();
  const parsed = firmProfileSchema.parse({
    name: formData.get("name"),
    address: formData.get("address") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    website: formData.get("website") || "",
    gstin: formData.get("gstin") || "",
  });

  const removeSignature = formData.get("removeSignature") === "on";
  const signatureFile = formData.get("signature");
  let signatureImage: string | null | undefined = undefined;

  if (removeSignature) {
    signatureImage = null;
  } else if (signatureFile instanceof File && signatureFile.size > 0) {
    if (!signatureFile.type.startsWith("image/")) {
      throw new Error("Signature must be an image file.");
    }
    if (signatureFile.size > MAX_SIGNATURE_BYTES) {
      throw new Error("Signature image must be smaller than 500KB.");
    }
    const buffer = Buffer.from(await signatureFile.arrayBuffer());
    signatureImage = `data:${signatureFile.type};base64,${buffer.toString("base64")}`;
  }

  await prisma.firmProfile.upsert({
    where: { id: "singleton" },
    update: {
      name: parsed.name,
      address: parsed.address || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      website: parsed.website || null,
      gstin: parsed.gstin || null,
      ...(signatureImage !== undefined ? { signatureImage } : {}),
    },
    create: {
      id: "singleton",
      name: parsed.name,
      address: parsed.address || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      website: parsed.website || null,
      gstin: parsed.gstin || null,
      signatureImage: signatureImage ?? null,
    },
  });

  revalidatePath("/settings");
}

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().optional(),
});

export async function updateEmailSettings(formData: FormData) {
  await requireAdvocate();
  const parsed = emailSettingsSchema.parse({
    smtpHost: formData.get("smtpHost") || "",
    smtpPort: formData.get("smtpPort") || undefined,
    smtpUser: formData.get("smtpUser") || "",
    smtpPass: formData.get("smtpPass") || "",
    fromName: formData.get("fromName") || "",
    fromEmail: formData.get("fromEmail") || "",
  });

  const existing = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });

  await prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: {
      smtpHost: parsed.smtpHost || null,
      smtpPort: parsed.smtpPort ?? null,
      smtpUser: parsed.smtpUser || null,
      // Keep the existing password if the field was left blank (already saved).
      smtpPass: parsed.smtpPass || existing?.smtpPass || null,
      fromName: parsed.fromName || null,
      fromEmail: parsed.fromEmail || null,
    },
    create: {
      id: "singleton",
      smtpHost: parsed.smtpHost || null,
      smtpPort: parsed.smtpPort ?? null,
      smtpUser: parsed.smtpUser || null,
      smtpPass: parsed.smtpPass || null,
      fromName: parsed.fromName || null,
      fromEmail: parsed.fromEmail || null,
    },
  });

  revalidatePath("/settings");
}

const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifscCode: z.string().min(1, "IFSC code is required"),
  branch: z.string().optional(),
  isDefault: z.string().optional(),
});

export async function createBankAccount(formData: FormData) {
  await requireAdvocate();
  const parsed = bankAccountSchema.parse({
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    ifscCode: formData.get("ifscCode"),
    branch: formData.get("branch") || "",
    isDefault: formData.get("isDefault") || undefined,
  });

  const existingCount = await prisma.bankAccount.count();
  const makeDefault = parsed.isDefault === "on" || existingCount === 0;

  if (makeDefault) {
    await prisma.bankAccount.updateMany({
      data: { isDefault: false },
      where: {},
    });
  }

  await prisma.bankAccount.create({
    data: {
      bankName: parsed.bankName,
      accountName: parsed.accountName,
      accountNumber: parsed.accountNumber,
      ifscCode: parsed.ifscCode,
      branch: parsed.branch || null,
      isDefault: makeDefault,
    },
  });

  revalidatePath("/settings");
}

export async function updateBankAccount(id: string, formData: FormData) {
  await requireAdvocate();
  const parsed = bankAccountSchema.parse({
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    ifscCode: formData.get("ifscCode"),
    branch: formData.get("branch") || "",
    isDefault: formData.get("isDefault") || undefined,
  });

  const makeDefault = parsed.isDefault === "on";
  if (makeDefault) {
    await prisma.bankAccount.updateMany({ data: { isDefault: false }, where: {} });
  }

  await prisma.bankAccount.update({
    where: { id },
    data: {
      bankName: parsed.bankName,
      accountName: parsed.accountName,
      accountNumber: parsed.accountNumber,
      ifscCode: parsed.ifscCode,
      branch: parsed.branch || null,
      ...(makeDefault ? { isDefault: true } : {}),
    },
  });

  revalidatePath("/settings");
}

export async function setDefaultBankAccount(id: string) {
  await requireAdvocate();
  await prisma.$transaction([
    prisma.bankAccount.updateMany({ data: { isDefault: false }, where: {} }),
    prisma.bankAccount.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/settings");
}

export async function deleteBankAccount(id: string) {
  await requireAdvocate();
  const bank = await prisma.bankAccount.findUniqueOrThrow({ where: { id } });

  try {
    await prisma.bankAccount.delete({ where: { id } });
  } catch {
    redirect("/settings?error=bank-in-use");
  }

  if (bank.isDefault) {
    const next = await prisma.bankAccount.findFirst({ orderBy: { createdAt: "asc" } });
    if (next) {
      await prisma.bankAccount.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  revalidatePath("/settings");
}
