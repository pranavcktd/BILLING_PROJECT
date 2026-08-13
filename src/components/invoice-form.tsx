"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClientOption = { id: string; name: string };
type MatterOption = { id: string; title: string; clientId: string };
type ContractOption = { id: string; title: string; clientId: string };
type BankAccountOption = { id: string; bankName: string; accountNumber: string; isDefault: boolean };
type BankSelection = { bankAccountIds: string[]; primaryBankAccountId: string };
type ServiceOption = { id: string; name: string; rate: string; unit: string | null };
type ItemRow = { description: string; quantity: string; rate: string };

export function InvoiceForm({
  action,
  clients,
  matters,
  contracts,
  bankAccounts,
  serviceItems,
  defaultValues,
  submitLabel = "Save Invoice",
}: {
  action: (formData: FormData) => void;
  clients: ClientOption[];
  matters: MatterOption[];
  contracts: ContractOption[];
  bankAccounts: BankAccountOption[];
  serviceItems: ServiceOption[];
  defaultValues?: {
    clientId?: string;
    matterId?: string;
    contractId?: string;
    bankAccountIds?: string[];
    primaryBankAccountId?: string;
    dueDate?: string;
    gstEnabled?: boolean;
    cgstPercent?: string;
    sgstPercent?: string;
    igstPercent?: string;
    notes?: string;
    items?: ItemRow[];
  };
  submitLabel?: string;
}) {
  const [clientId, setClientId] = useState(defaultValues?.clientId ?? "");
  const [matterId, setMatterId] = useState(defaultValues?.matterId ?? "");
  const [contractId, setContractId] = useState(defaultValues?.contractId ?? "");
  const initialBankIds =
    defaultValues?.bankAccountIds ??
    (bankAccounts.find((b) => b.isDefault)
      ? [bankAccounts.find((b) => b.isDefault)!.id]
      : []);
  const [bankSelection, setBankSelection] = useState<BankSelection>({
    bankAccountIds: initialBankIds,
    primaryBankAccountId:
      defaultValues?.primaryBankAccountId ?? initialBankIds[0] ?? "",
  });

  function toggleBank(id: string, checked: boolean) {
    setBankSelection((prev) => {
      const bankAccountIds = checked
        ? [...prev.bankAccountIds, id]
        : prev.bankAccountIds.filter((b) => b !== id);
      let primaryBankAccountId = prev.primaryBankAccountId;
      if (checked && bankAccountIds.length === 1) {
        primaryBankAccountId = id;
      } else if (!checked && prev.primaryBankAccountId === id) {
        primaryBankAccountId = bankAccountIds[0] ?? "";
      }
      return { bankAccountIds, primaryBankAccountId };
    });
  }
  const [items, setItems] = useState<ItemRow[]>(
    defaultValues?.items?.length
      ? defaultValues.items
      : [{ description: "", quantity: "1", rate: "" }]
  );
  const [gstEnabled, setGstEnabled] = useState(defaultValues?.gstEnabled ?? false);
  const [cgstPercent, setCgstPercent] = useState(defaultValues?.cgstPercent ?? "9");
  const [sgstPercent, setSgstPercent] = useState(defaultValues?.sgstPercent ?? "9");
  const [igstPercent, setIgstPercent] = useState(defaultValues?.igstPercent ?? "0");

  const filteredMatters = matters.filter((m) => m.clientId === clientId);
  const filteredContracts = contracts.filter((c) => c.clientId === clientId);

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + qty * rate;
  }, 0);

  const cgstAmt = gstEnabled ? (subtotal * (parseFloat(cgstPercent) || 0)) / 100 : 0;
  const sgstAmt = gstEnabled ? (subtotal * (parseFloat(sgstPercent) || 0)) / 100 : 0;
  const igstAmt = gstEnabled ? (subtotal * (parseFloat(igstPercent) || 0)) / 100 : 0;
  const total = subtotal + cgstAmt + sgstAmt + igstAmt;

  function updateItem(index: number, field: keyof ItemRow, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: "1", rate: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client</Label>
          <Select
            name="clientId"
            value={clientId}
            onValueChange={(value) => {
              setClientId(value as string);
              setMatterId("");
              setContractId("");
            }}
          >
            <SelectTrigger id="clientId" className="w-full">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="matterId">Matter (optional)</Label>
          <Select
            name="matterId"
            value={matterId}
            onValueChange={(value) => setMatterId(value as string)}
            disabled={!clientId}
          >
            <SelectTrigger id="matterId" className="w-full">
              <SelectValue
                placeholder={clientId ? "Select a matter" : "Select a client first"}
              />
            </SelectTrigger>
            <SelectContent>
              {filteredMatters.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractId">Contract (optional)</Label>
          <Select
            name="contractId"
            value={contractId}
            onValueChange={(value) => setContractId(value as string)}
            disabled={!clientId}
          >
            <SelectTrigger id="contractId" className="w-full">
              <SelectValue
                placeholder={clientId ? "Select a contract" : "Select a client first"}
              />
            </SelectTrigger>
            <SelectContent>
              {filteredContracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultValues?.dueDate}
          />
        </div>
      </div>

      {bankAccounts.length > 0 && (
        <div className="space-y-2 rounded-lg border p-4">
          <Label>Bank Account(s) for Payment</Label>
          <p className="text-xs text-muted-foreground">
            Select one or more accounts to print on this invoice.
          </p>
          <div className="space-y-2">
            {bankAccounts.map((b) => {
              const checked = bankSelection.bankAccountIds.includes(b.id);
              return (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleBank(b.id, e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  {checked && (
                    <input type="hidden" name="bankAccountIds" value={b.id} />
                  )}
                  {b.bankName} — {b.accountNumber}
                  {b.isDefault ? " (Default)" : ""}
                </label>
              );
            })}
          </div>
          {bankSelection.bankAccountIds.length > 1 && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="primaryBankAccountId">
                Default bank for this invoice
              </Label>
              <Select
                name="primaryBankAccountId"
                value={bankSelection.primaryBankAccountId}
                onValueChange={(value) =>
                  setBankSelection((prev) => ({
                    ...prev,
                    primaryBankAccountId: value as string,
                  }))
                }
              >
                <SelectTrigger id="primaryBankAccountId" className="w-full">
                  <SelectValue placeholder="Select default bank" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts
                    .filter((b) => bankSelection.bankAccountIds.includes(b.id))
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.bankName} — {b.accountNumber}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {bankSelection.bankAccountIds.length === 1 && (
            <input
              type="hidden"
              name="primaryBankAccountId"
              value={bankSelection.bankAccountIds[0]}
            />
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Line Items</Label>
          <a
            href="/services/new"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:underline"
          >
            + Add new catalog item
          </a>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Catalog Item</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Qty</TableHead>
              <TableHead className="w-32">Rate</TableHead>
              <TableHead className="w-32">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.rate) || 0;
              const amount = qty * rate;
              return (
                <TableRow key={i}>
                  <TableCell>
                    <select
                      className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                      value=""
                      onChange={(e) => {
                        const service = serviceItems.find((s) => s.id === e.target.value);
                        if (service) {
                          updateItem(i, "description", service.name);
                          updateItem(i, "rate", service.rate);
                        }
                        e.target.value = "";
                      }}
                    >
                      <option value="">Select or type manually…</option>
                      {serviceItems.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — ₹{s.rate}
                          {s.unit ? `/${s.unit}` : ""}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      name="itemDescription"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="Professional fees"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      name="itemQuantity"
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      name="itemRate"
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(i, "rate", e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="text-sm">₹{amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          Add Item
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="gstEnabled"
            checked={gstEnabled}
            onChange={(e) => setGstEnabled(e.target.checked)}
            className="size-4 rounded border-input"
          />
          Apply GST
        </label>
        {gstEnabled && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cgstPercent" className="text-xs text-muted-foreground">
                CGST %
              </Label>
              <Input
                id="cgstPercent"
                name="cgstPercent"
                type="number"
                step="0.01"
                value={cgstPercent}
                onChange={(e) => setCgstPercent(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sgstPercent" className="text-xs text-muted-foreground">
                SGST %
              </Label>
              <Input
                id="sgstPercent"
                name="sgstPercent"
                type="number"
                step="0.01"
                value={sgstPercent}
                onChange={(e) => setSgstPercent(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="igstPercent" className="text-xs text-muted-foreground">
                IGST %
              </Label>
              <Input
                id="igstPercent"
                name="igstPercent"
                type="number"
                step="0.01"
                value={igstPercent}
                onChange={(e) => setIgstPercent(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {gstEnabled && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST</span>
                <span>₹{cgstAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST</span>
                <span>₹{sgstAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST</span>
                <span>₹{igstAmt.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes} />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
