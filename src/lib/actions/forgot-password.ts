"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSystemMailer } from "@/lib/mailer";

const RANDOM_PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateRandomPassword(length = 12) {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += RANDOM_PASSWORD_CHARS[crypto.randomInt(RANDOM_PASSWORD_CHARS.length)];
  }
  return password;
}

const schema = z.object({ email: z.string().email("Enter a valid email address") });

export async function requestPasswordReset(formData: FormData) {
  const parsed = schema.parse({ email: formData.get("email") });
  const email = parsed.email.toLowerCase();

  // Look up and email outside a try/catch that would leak whether the
  // account exists — always redirect to the same confirmation regardless.
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    const randomPassword = generateRandomPassword();
    const mailer = await getSystemMailer();

    if (mailer) {
      // Send BEFORE committing the password change: if delivery fails (bad
      // SMTP config, unreachable host, etc.), the user's existing password
      // must keep working rather than being replaced by a value nobody
      // received. Never let a send failure surface as a 500 to the caller.
      try {
        await mailer.transporter.sendMail({
          from: mailer.from,
          to: user.email,
          subject: "Your password has been reset",
          text: `Hello ${user.name},\n\nA password reset was requested for your account. Your temporary password is:\n\n${randomPassword}\n\nYou will be required to change it as soon as you sign in.\n\nIf you did not request this, contact your administrator immediately.`,
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await bcrypt.hash(randomPassword, 12), mustChangePassword: true },
        });
      } catch (err) {
        console.error(`[forgot-password] Failed to send reset email to ${user.email}:`, err);
      }
    } else {
      console.error("[forgot-password] No system SMTP configured; cannot send reset email.");
    }
  }

  redirect("/forgot-password?sent=1");
}
