"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateFirmProfile } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FirmProfileValues = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  gstin: string | null;
  signatureImage: string | null;
};

type SaveState = { ok: boolean; ts: number; error?: string } | null;

async function saveAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  try {
    await updateFirmProfile(formData);
    return { ok: true, ts: Date.now() };
  } catch (err) {
    return { ok: false, ts: Date.now(), error: err instanceof Error ? err.message : "Failed to save." };
  }
}

export function SettingsProfileForm({ firmProfile }: { firmProfile: FirmProfileValues }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveAction, null);
  const [newFilePreview, setNewFilePreview] = useState<string | null>(null);
  const [removeSignature, setRemoveSignature] = useState(false);
  const currentSignature = firmProfile.signatureImage;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Firm profile saved successfully.");
    } else {
      toast.error(state.error ?? "Failed to save firm profile.");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Firm / Advocate Name</Label>
        <Input id="name" name="name" defaultValue={firmProfile.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" rows={2} defaultValue={firmProfile.address ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={firmProfile.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={firmProfile.email ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={firmProfile.website ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstin">GSTIN</Label>
          <Input id="gstin" name="gstin" defaultValue={firmProfile.gstin ?? ""} />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label>Digital Signature</Label>
        <p className="text-xs text-muted-foreground">
          Uploaded here, this image is printed on your invoices, quotations, and contracts.
        </p>
        {newFilePreview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={newFilePreview}
              alt="New signature preview"
              className="h-16 rounded border bg-white object-contain px-2"
            />
            <span className="text-xs text-muted-foreground">New signature (not saved yet)</span>
          </div>
        ) : (
          currentSignature &&
          !removeSignature && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSignature}
                alt="Signature preview"
                className="h-16 rounded border bg-white object-contain px-2"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="removeSignature"
                  checked={removeSignature}
                  onChange={(e) => setRemoveSignature(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                Remove signature
              </label>
            </div>
          )
        )}
        {(!currentSignature || removeSignature || newFilePreview) && (
          <Input
            name="signature"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setNewFilePreview(null);
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setNewFilePreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Firm Profile"}
      </Button>
    </form>
  );
}
