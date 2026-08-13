import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { updateClientNote } from "@/lib/actions/client-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function EditClientNotePage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  await requireAdvocate();
  const { id, noteId } = await params;

  const [client, note] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: { matters: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.clientNote.findUnique({ where: { id: noteId } }),
  ]);
  if (!client || !note || note.clientId !== client.id) notFound();

  const updateNote = updateClientNote.bind(null, note.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Ledger Entry</h1>
        <p className="text-sm text-muted-foreground">for {client.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateNote} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={note.type}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                  <SelectItem value="NOTE">Note / Remark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (leave blank for a plain note)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={note.amount ? note.amount.toString() : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Matter / Department (optional)</Label>
              <Input
                id="department"
                name="department"
                list="matter-suggestions"
                placeholder="e.g. Property Dispute"
                defaultValue={note.department ?? ""}
              />
              {client.matters.length > 0 && (
                <datalist id="matter-suggestions">
                  {client.matters.map((m) => (
                    <option key={m.id} value={m.title} />
                  ))}
                </datalist>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={note.date.toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description / Remark</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={note.description} required />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
