"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendInvoiceEmail } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";

export function SendInvoiceEmailButton({
  invoiceId,
  clientEmail,
}: {
  invoiceId: string;
  clientEmail: string | null;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!clientEmail) {
      toast.error("This client has no email address on file.");
      return;
    }
    if (!confirm(`Send this invoice to ${clientEmail}?`)) return;
    setPending(true);
    try {
      await sendInvoiceEmail(invoiceId);
      toast.success(`Invoice emailed to ${clientEmail}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invoice.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      type="button"
      disabled={pending || !clientEmail}
      onClick={handleClick}
      title={!clientEmail ? "Add an email address to this client's profile first." : undefined}
    >
      {pending ? "Sending..." : "Send it to Client"}
    </Button>
  );
}
