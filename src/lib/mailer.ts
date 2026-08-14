import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant-context";

export async function getMailer() {
  const settings = await prisma.emailSettings.findUnique({
    where: { organizationId: await getCurrentOrgId() },
  });

  if (!settings?.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  const from = settings.fromEmail
    ? settings.fromName
      ? `"${settings.fromName}" <${settings.fromEmail}>`
      : settings.fromEmail
    : settings.smtpUser;

  return { transporter, from };
}
