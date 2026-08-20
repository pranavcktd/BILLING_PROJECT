import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { updateSystemEmailSettings } from "@/lib/actions/super-admin";
import { EmailSettingsForm } from "@/components/email-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();

  const settings = await prisma.systemEmailSettings.findFirst();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System Email Settings</h1>
        <p className="text-sm text-muted-foreground">
          Used for system emails: forgot-password temporary passwords and data backup
          attachments. This is separate from each organization&apos;s own SMTP settings
          used for sending invoices to their clients.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SMTP Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailSettingsForm
            action={updateSystemEmailSettings}
            description="Enter the outgoing (SMTP) mail server this app uses for system-level emails. For Gmail, use an App Password rather than your normal password."
            settings={{
              smtpHost: settings?.smtpHost ?? null,
              smtpPort: settings?.smtpPort ?? null,
              smtpUser: settings?.smtpUser ?? null,
              hasPassword: !!settings?.smtpPass,
              fromName: settings?.fromName ?? null,
              fromEmail: settings?.fromEmail ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
