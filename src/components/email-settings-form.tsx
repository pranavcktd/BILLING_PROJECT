"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmailSettingsValues = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  hasPassword: boolean;
  fromName: string | null;
  fromEmail: string | null;
};

type SaveState = { ok: boolean; ts: number; error?: string } | null;
type TestState = { ok: boolean; ts: number; error?: string; sentTo?: string } | null;

export function EmailSettingsForm({
  settings,
  action,
  testAction,
  description,
}: {
  settings: EmailSettingsValues;
  action: (formData: FormData) => Promise<void>;
  testAction?: (formData: FormData) => Promise<string>;
  description?: string;
}) {
  const saveAction = async (_prev: SaveState, formData: FormData): Promise<SaveState> => {
    try {
      await action(formData);
      return { ok: true, ts: Date.now() };
    } catch (err) {
      return { ok: false, ts: Date.now(), error: err instanceof Error ? err.message : "Failed to save." };
    }
  };
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveAction, null);

  const runTest = async (_prev: TestState, formData: FormData): Promise<TestState> => {
    if (!testAction) return null;
    try {
      const sentTo = await testAction(formData);
      return { ok: true, ts: Date.now(), sentTo };
    } catch (err) {
      return { ok: false, ts: Date.now(), error: err instanceof Error ? err.message : "Test email failed." };
    }
  };
  const [testState, testFormAction, testPending] = useActionState<TestState, FormData>(runTest, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Email settings saved successfully.");
    } else {
      toast.error(state.error ?? "Failed to save email settings.");
    }
  }, [state]);

  useEffect(() => {
    if (!testState) return;
    if (testState.ok) {
      toast.success(`Test email sent to ${testState.sentTo}. Check the inbox (and spam folder).`);
    } else {
      toast.error(testState.error ?? "Test email failed.");
    }
  }, [testState]);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {description ??
          "Enter your outgoing (SMTP) mail server details so invoices can be emailed to clients directly from this app. For Gmail, use an App Password rather than your normal password."}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="smtpHost">SMTP Host</Label>
          <Input
            id="smtpHost"
            name="smtpHost"
            placeholder="smtp.gmail.com"
            defaultValue={settings.smtpHost ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtpPort">SMTP Port</Label>
          <Input
            id="smtpPort"
            name="smtpPort"
            type="number"
            placeholder="587"
            defaultValue={settings.smtpPort ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="smtpUser">SMTP Username</Label>
          <Input
            id="smtpUser"
            name="smtpUser"
            placeholder="you@example.com"
            defaultValue={settings.smtpUser ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtpPass">SMTP Password</Label>
          <Input
            id="smtpPass"
            name="smtpPass"
            type="password"
            placeholder={settings.hasPassword ? "•••••••• (leave blank to keep)" : ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromName">From Name</Label>
          <Input
            id="fromName"
            name="fromName"
            placeholder="Your Firm Name"
            defaultValue={settings.fromName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fromEmail">From Email</Label>
          <Input
            id="fromEmail"
            name="fromEmail"
            type="email"
            placeholder="billing@yourfirm.com"
            defaultValue={settings.fromEmail ?? ""}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Email Settings"}
      </Button>

      {testAction && (
        <div className="space-y-2 rounded-md border p-3">
          <Label htmlFor="testRecipient" className="text-xs text-muted-foreground">
            Send a test email to confirm these settings actually work (uses whatever is
            currently filled in above, saved or not)
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="testRecipient"
              name="testRecipient"
              type="email"
              placeholder="you@example.com (defaults to your own login email)"
              className="max-w-xs"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              formAction={testFormAction}
              disabled={testPending}
            >
              {testPending ? "Sending..." : "Test SMTP Mail Service"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
