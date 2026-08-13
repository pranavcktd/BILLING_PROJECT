"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BankAccountOption = { id: string; bankName: string; accountNumber: string; isDefault: boolean };

export function PaymentFormFields({
  bankAccounts,
  defaultValues,
}: {
  bankAccounts: BankAccountOption[];
  defaultValues?: {
    amount?: string;
    method?: string;
    bankAccountId?: string;
    paidOn?: string;
    referenceNumber?: string;
    notes?: string;
  };
}) {
  const [method, setMethod] = useState(defaultValues?.method ?? "UPI");
  const [bankAccountId, setBankAccountId] = useState(
    defaultValues?.bankAccountId ?? bankAccounts.find((b) => b.isDefault)?.id ?? ""
  );

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.amount}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="method">Method</Label>
          <Select name="method" value={method} onValueChange={(v) => setMethod(v as string)}>
            <SelectTrigger id="method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paidOn">Date</Label>
          <Input id="paidOn" name="paidOn" type="date" defaultValue={defaultValues?.paidOn} />
        </div>
      </div>

      {method === "BANK_TRANSFER" && bankAccounts.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="bankAccountId">Credited To</Label>
          <Select
            name="bankAccountId"
            value={bankAccountId}
            onValueChange={(v) => setBankAccountId(v as string)}
          >
            <SelectTrigger id="bankAccountId" className="w-full">
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.bankName} — {b.accountNumber}
                  {b.isDefault ? " (Default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="referenceNumber">Reference Number (optional)</Label>
        <Input
          id="referenceNumber"
          name="referenceNumber"
          placeholder="UTR / Cheque no."
          defaultValue={defaultValues?.referenceNumber}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={defaultValues?.notes} />
      </div>
    </>
  );
}
