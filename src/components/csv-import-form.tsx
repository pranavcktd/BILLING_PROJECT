"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BulkImportResult } from "@/lib/actions/clients";

type State = (BulkImportResult & { error?: undefined }) | { error: string } | null;

export function CsvImportForm({
  action,
  templateHeaders,
  templateFilename,
}: {
  action: (formData: FormData) => Promise<BulkImportResult>;
  templateHeaders: string[];
  templateFilename: string;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      try {
        const result = await action(formData);
        if (result.created > 0) toast.success(`Imported ${result.created} row(s).`);
        if (result.skipped.length > 0) toast.error(`${result.skipped.length} row(s) skipped.`);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Import failed.";
        toast.error(message);
        return { error: message };
      }
    },
    null
  );

  function downloadTemplate() {
    const csv = templateHeaders.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
        <span className="text-muted-foreground">
          Columns expected: <code>{templateHeaders.join(", ")}</code>
        </span>
        <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">CSV File</Label>
          <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Importing..." : "Import"}
        </Button>
      </form>

      {state && "error" in state && state.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state && "created" in state && (
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">
            {state.created} row(s) imported successfully.
            {state.skipped.length > 0 && ` ${state.skipped.length} row(s) skipped.`}
          </p>
          {state.skipped.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-muted-foreground">
              {state.skipped.map((s, i) => (
                <li key={i}>
                  Row {s.row}: {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
