"use client";

import { useState } from "react";
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

type ClientOption = { id: string; name: string };
type MatterOption = { id: string; title: string; clientId: string };

export function ContractForm({
  action,
  clients,
  matters,
  defaultValues,
  submitLabel = "Save Contract",
}: {
  action: (formData: FormData) => void;
  clients: ClientOption[];
  matters: MatterOption[];
  defaultValues?: {
    clientId?: string;
    matterId?: string;
    title?: string;
    content?: string;
  };
  submitLabel?: string;
}) {
  const [clientId, setClientId] = useState(defaultValues?.clientId ?? "");
  const [matterId, setMatterId] = useState(defaultValues?.matterId ?? "");

  const filteredMatters = matters.filter((m) => m.clientId === clientId);

  return (
    <form action={action} className="space-y-4">
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
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={defaultValues?.title} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          rows={14}
          defaultValue={defaultValues?.content}
          className="font-mono text-sm"
          required
        />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
