import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant-context";

export type MailerConfig = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  fromName: string | null;
  fromEmail: string | null;
};

export function buildMailer(settings: MailerConfig | null | undefined) {
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

export async function getMailer() {
  const settings = await prisma.emailSettings.findUnique({
    where: { organizationId: await getCurrentOrgId() },
  });
  return buildMailer(settings);
}

// System-level mailer (Super Admin's own SMTP), used for cross-tenant
// system email — the forgot-password flow (runs before any session/org
// context exists) and backup-attachment emails. Not tenant-scoped: there is
// exactly one row in SystemEmailSettings.
export async function getSystemMailer() {
  const settings = await prisma.systemEmailSettings.findFirst();
  return buildMailer(settings);
}

export async function sendTestEmail(mailer: NonNullable<ReturnType<typeof buildMailer>>, to: string) {
  await mailer.transporter.sendMail({
    from: mailer.from,
    to,
    subject: "Test email from Advocate Billing",
    text: `This is a test email confirming your SMTP settings are working correctly.\n\nSent at ${new Date().toLocaleString()}.`,
  });
}
