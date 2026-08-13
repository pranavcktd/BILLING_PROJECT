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
type ServiceOption = { id: string; name: string; rate: string; unit: string | null };
type ItemRow = { description: string; quantity: string; rate: string };

export function QuotationForm({
  action,
  clients,
  matters,
  serviceItems,
  defaultValues,
  submitLabel = "Save Quotation",
}: {
  action: (formData: FormData) => void;
  clients: ClientOption[];
  matters: MatterOption[];
  serviceItems: ServiceOption[];
  defaultValues?: {
    clientId?: string;
    matterId?: string;
    validUntil?: string;
    taxAmount?: string;
    notes?: string;
    items?: ItemRow[];
  };
  submitLabel?: string;
}) {
  const [clientId, setClientId] = useState(defaultValues?.clientId ?? "");
  const [matterId, setMatterId] = useState(defaultValues?.matterId ?? "");
  const [items, setItems] = useState<ItemRow[]>(
    defaultValues?.items?.length
      ? defaultValues.items
      : [{ description: "", quantity: "1", rate: "" }]
  );
  const [taxAmount, setTaxAmount] = useState(defaultValues?.taxAmount ?? "0");

  const filteredMatters = matters.filter((m) => m.clientId === clientId);

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + qty * rate;
  }, 0);
  const total = subtotal + (parseFloat(taxAmount) || 0);

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

      <div className="space-y-2">
        <Label htmlFor="validUntil">Valid Until</Label>
        <Input
          id="validUntil"
          name="validUntil"
          type="date"
          defaultValue={defaultValues?.validUntil}
          className="w-48"
        />
      </div>

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
                      placeholder="Legal consultation fee"
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

      <div className="flex justify-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="taxAmount" className="text-muted-foreground">
              Tax
            </Label>
            <Input
              id="taxAmount"
              name="taxAmount"
              type="number"
              step="0.01"
              className="w-28 text-right"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
            />
          </div>
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
