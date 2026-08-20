"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RestoreState = { ok: boolean; ts: number; error?: string } | null;

export function RestoreConfirmDialog({
  orgName,
  action,
}: {
  orgName: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);

  const doRestore = async (_prev: RestoreState, formData: FormData): Promise<RestoreState> => {
    try {
      await action(formData);
      return { ok: true, ts: Date.now() };
    } catch (err) {
      return { ok: false, ts: Date.now(), error: err instanceof Error ? err.message : "Restore failed." };
    }
  };
  const [state, formAction, pending] = useActionState<RestoreState, FormData>(doRestore, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Restore completed. A safety backup of the prior data was emailed before the restore ran.");
      setOpen(false);
    } else {
      toast.error(state.error ?? "Restore failed.");
    }
  }, [state]);

  const canSubmit = confirmText.trim() === orgName;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>Restore from Backup</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore &ldquo;{orgName}&rdquo; from backup</DialogTitle>
          <DialogDescription>
            This permanently replaces <strong>all</strong> current clients, matters, quotations,
            contracts, invoices, payments, and related records with the contents of the JSON file
            you upload. Logins and passwords are not affected. Before anything is changed, a full
            backup of the current data is emailed to you as a safety copy.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backupFile">Backup JSON file</Label>
            <Input id="backupFile" name="backupFile" type="file" accept="application/json" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmName">
              Type <span className="font-medium text-foreground">{orgName}</span> to confirm
            </Label>
            <Input
              id="confirmName"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="destructive" disabled={!canSubmit || pending}>
              {pending ? "Restoring..." : "Wipe and Restore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
