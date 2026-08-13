"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  invoiceStatusWarning,
  quotationStatusWarning,
  contractStatusWarning,
} from "@/lib/status-warnings";

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

type WarningSpec =
  | { kind: "invoice"; amountPaid: number }
  | { kind: "quotation"; hasContract: boolean }
  | { kind: "contract"; invoiceCount: number };

function getWarningFor(spec: WarningSpec | undefined, current: string, next: string): string | null {
  if (!spec) return null;
  switch (spec.kind) {
    case "invoice":
      return invoiceStatusWarning(current, next, spec.amountPaid);
    case "quotation":
      return quotationStatusWarning(current, next, spec.hasContract);
    case "contract":
      return contractStatusWarning(current, next, spec.invoiceCount);
    default:
      return null;
  }
}

export function StatusChangeForm({
  action,
  currentStatus,
  options,
  warning,
}: {
  action: (formData: FormData) => Promise<void> | void;
  currentStatus: string;
  options: { value: string; label: string }[];
  /** Plain, serializable context describing what to warn about for risky transitions. */
  warning?: WarningSpec;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Select name="status" value={status} onValueChange={(v) => setStatus(v as string)}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status === currentStatus || pending}
        onClick={async () => {
          const warningMessage = getWarningFor(warning, currentStatus, status);
          if (warningMessage && !confirm(warningMessage)) {
            return;
          }
          setPending(true);
          const formData = new FormData();
          formData.set("status", status);
          try {
            await action(formData);
            toast.success("Status updated.");
          } catch (err) {
            if (isRedirectError(err)) throw err;
            toast.error(err instanceof Error ? err.message : "Failed to update status.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Updating..." : "Update Status"}
      </Button>
    </div>
  );
}
