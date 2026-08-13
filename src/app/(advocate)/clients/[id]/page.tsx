import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { deleteClient } from "@/lib/actions/clients";
import { deleteMatter } from "@/lib/actions/matters";
import { deleteQuotation, setQuotationStatus } from "@/lib/actions/quotations";
import { deleteContract, setContractStatus } from "@/lib/actions/contracts";
import { deleteInvoice, setInvoiceStatus } from "@/lib/actions/invoices";
import { createPortalUser, resetPortalPassword } from "@/lib/actions/portal-users";
import { deleteClientNote } from "@/lib/actions/client-notes";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { RowActionsMenu, type RowAction } from "@/components/row-actions-menu";

const matterStatusVariant: Record<string, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  ON_HOLD: "secondary",
  CLOSED: "outline",
};

const quotationStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
};

const contractStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  SIGNED: "default",
  CANCELLED: "destructive",
};

const invoiceStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "outline",
};

const noteTypeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  CREDIT: "default",
  DEBIT: "destructive",
  NOTE: "outline",
};

const noteTypeLabel: Record<string, string> = {
  CREDIT: "Credit",
  DEBIT: "Debit",
  NOTE: "Note",
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  await requireAdvocate();
  const { id } = await params;
  const { error, tab } = await searchParams;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      matters: { orderBy: { createdAt: "desc" } },
      quotations: { orderBy: { issueDate: "desc" }, include: { matter: true } },
      contracts: { orderBy: { createdAt: "desc" }, include: { matter: true } },
      invoices: { orderBy: { issueDate: "desc" }, include: { matter: true } },
      ledger: { orderBy: { date: "desc" } },
      user: true,
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            Client since {client.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/clients/${client.id}/edit`} />}
          >
            Edit
          </Button>
          <form action={deleteClient.bind(null, client.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this client? This cannot be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {error === "has-records" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          This client can&apos;t be deleted because it has matters, quotations,
          contracts, or invoices linked to it.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Email: </span>
              {client.email ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Phone: </span>
              {client.phone ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Address: </span>
              {client.address ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">GSTIN: </span>
              {client.gstin ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">TAN: </span>
              {client.tan ?? "—"}
            </div>
            {client.notes && (
              <div>
                <span className="text-muted-foreground">Notes: </span>
                {client.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <Tabs
              defaultValue={
                tab && ["matters", "quotations", "contracts", "invoices", "ledger"].includes(tab)
                  ? tab
                  : "matters"
              }
            >
              <TabsList>
                <TabsTrigger value="matters">Matters ({client.matters.length})</TabsTrigger>
                <TabsTrigger value="quotations">
                  Quotations ({client.quotations.length})
                </TabsTrigger>
                <TabsTrigger value="contracts">
                  Contracts ({client.contracts.length})
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  Invoices ({client.invoices.length})
                </TabsTrigger>
                <TabsTrigger value="ledger">
                  Ledger &amp; Notes ({client.ledger.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matters" className="mt-4">
                <div className="mb-3 flex justify-end">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/clients/${client.id}/matters/new`} />}
                  >
                    New Matter
                  </Button>
                </div>
                {client.matters.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No matters yet for this client.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.matters.map((matter) => {
                        const actions: RowAction[] = [
                          { type: "link", label: "View", href: `/matters/${matter.id}` },
                          { type: "link", label: "Edit", href: `/matters/${matter.id}/edit` },
                          {
                            type: "action",
                            label: "Delete",
                            action: deleteMatter.bind(null, matter.id),
                            confirmMessage: "Delete this matter? This cannot be undone.",
                            destructive: true,
                          },
                        ];
                        return (
                          <TableRow key={matter.id}>
                            <TableCell className="font-medium">
                              <Link href={`/matters/${matter.id}`} className="hover:underline">
                                {matter.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={matterStatusVariant[matter.status]}>
                                {matter.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>{matter.createdAt.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <RowActionsMenu actions={actions} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="quotations" className="mt-4">
                <div className="mb-3 flex justify-end">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/quotations/new?clientId=${client.id}`} />}
                  >
                    New Quotation
                  </Button>
                </div>
                {client.quotations.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No quotations yet for this client.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.quotations.map((q) => {
                        const actions: RowAction[] = [
                          { type: "link", label: "View", href: `/quotations/${q.id}` },
                          { type: "link", label: "Edit", href: `/quotations/${q.id}/edit` },
                        ];
                        if (q.status === "DRAFT" || q.status === "SENT") {
                          actions.push({
                            type: "action",
                            label: "Cancel Quotation",
                            action: setQuotationStatus.bind(null, q.id, "REJECTED"),
                            confirmMessage: "Cancel this quotation?",
                          });
                        }
                        actions.push({
                          type: "action",
                          label: "Delete",
                          action: deleteQuotation.bind(null, q.id),
                          confirmMessage: "Delete this quotation? This cannot be undone.",
                          destructive: true,
                        });
                        return (
                          <TableRow key={q.id}>
                            <TableCell className="font-medium">
                              <Link href={`/quotations/${q.id}`} className="hover:underline">
                                {q.number}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={quotationStatusVariant[q.status]}>{q.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">₹{q.total.toFixed(2)}</TableCell>
                            <TableCell>{q.issueDate.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <RowActionsMenu actions={actions} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="contracts" className="mt-4">
                <div className="mb-3 flex justify-end">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/contracts/new?clientId=${client.id}`} />}
                  >
                    New Contract
                  </Button>
                </div>
                {client.contracts.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No contracts yet for this client.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.contracts.map((c) => {
                        const actions: RowAction[] = [
                          { type: "link", label: "View", href: `/contracts/${c.id}` },
                          { type: "link", label: "Edit", href: `/contracts/${c.id}/edit` },
                        ];
                        if (c.status === "DRAFT" || c.status === "SENT") {
                          actions.push({
                            type: "action",
                            label: "Cancel Contract",
                            action: setContractStatus.bind(null, c.id, "CANCELLED"),
                            confirmMessage: "Cancel this contract?",
                          });
                        }
                        actions.push({
                          type: "action",
                          label: "Delete",
                          action: deleteContract.bind(null, c.id),
                          confirmMessage: "Delete this contract? This cannot be undone.",
                          destructive: true,
                        });
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              <Link href={`/contracts/${c.id}`} className="hover:underline">
                                {c.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={contractStatusVariant[c.status]}>{c.status}</Badge>
                            </TableCell>
                            <TableCell>{c.createdAt.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <RowActionsMenu actions={actions} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="mt-4">
                <div className="mb-3 flex justify-end">
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/invoices/new?clientId=${client.id}`} />}
                  >
                    New Invoice
                  </Button>
                </div>
                {client.invoices.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No invoices yet for this client.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.invoices.map((inv) => {
                        const status = displayInvoiceStatus(inv);
                        const balance = inv.total.minus(inv.amountPaid);
                        const actions: RowAction[] = [
                          { type: "link", label: "View", href: `/invoices/${inv.id}` },
                          { type: "link", label: "Edit", href: `/invoices/${inv.id}/edit` },
                        ];
                        if (inv.status === "DRAFT" || inv.status === "SENT" || inv.status === "PARTIALLY_PAID") {
                          actions.push({
                            type: "action",
                            label: "Cancel Invoice",
                            action: setInvoiceStatus.bind(null, inv.id, "CANCELLED"),
                            confirmMessage:
                              Number(inv.amountPaid) > 0
                                ? `This invoice has ₹${inv.amountPaid.toFixed(2)} in recorded payments. Cancelling it will NOT reverse them. Continue?`
                                : inv.status !== "DRAFT"
                                ? "This invoice has already been sent to the client. Cancel it anyway?"
                                : "Cancel this invoice?",
                          });
                        }
                        actions.push({
                          type: "action",
                          label: "Delete",
                          action: deleteInvoice.bind(null, inv.id),
                          confirmMessage: "Delete this invoice? This cannot be undone.",
                          destructive: true,
                        });
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">
                              <Link href={`/invoices/${inv.id}`} className="hover:underline">
                                {inv.number}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={invoiceStatusVariant[status]}>
                                {invoiceStatusLabel(status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">₹{inv.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{balance.toFixed(2)}</TableCell>
                            <TableCell>{inv.issueDate.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <RowActionsMenu actions={actions} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="ledger" className="mt-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Net:{" "}
                    <span className="font-medium text-foreground">
                      ₹
                      {client.ledger
                        .reduce(
                          (sum, n) =>
                            n.type === "CREDIT"
                              ? sum + Number(n.amount ?? 0)
                              : n.type === "DEBIT"
                              ? sum - Number(n.amount ?? 0)
                              : sum,
                          0
                        )
                        .toFixed(2)}
                    </span>{" "}
                    (Credit − Debit)
                  </div>
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/clients/${client.id}/notes/new`} />}
                  >
                    New Entry
                  </Button>
                </div>
                {client.ledger.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No credit/debit entries or notes yet for this client.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Matter / Dept.</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.ledger.map((note) => {
                        const actions: RowAction[] = [
                          {
                            type: "link",
                            label: "Edit",
                            href: `/clients/${client.id}/notes/${note.id}/edit`,
                          },
                          {
                            type: "action",
                            label: "Delete",
                            action: deleteClientNote.bind(null, note.id),
                            confirmMessage: "Delete this ledger entry? This cannot be undone.",
                            destructive: true,
                          },
                        ];
                        return (
                          <TableRow key={note.id}>
                            <TableCell>{note.date.toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={noteTypeVariant[note.type]}>
                                {noteTypeLabel[note.type]}
                              </Badge>
                            </TableCell>
                            <TableCell>{note.department ?? "—"}</TableCell>
                            <TableCell className="max-w-xs truncate">{note.description}</TableCell>
                            <TableCell className="text-right">
                              {note.amount ? `₹${note.amount.toFixed(2)}` : "—"}
                            </TableCell>
                            <TableCell>
                              <RowActionsMenu actions={actions} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portal Access</CardTitle>
        </CardHeader>
        <CardContent>
          {client.user ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Login email: </span>
                {client.user.email}
              </div>
              <div>
                <span className="text-muted-foreground">Password status: </span>
                {client.user.mustChangePassword ? (
                  <Badge variant="secondary">Must change on next login</Badge>
                ) : (
                  <Badge>Set by client</Badge>
                )}
              </div>
              <form action={resetPortalPassword.bind(null, client.user.id)} className="pt-2">
                <ConfirmSubmitButton confirmMessage="Reset this client's password back to the default (Client@123)? They'll be required to change it on next login.">
                  Reset to Default Password
                </ConfirmSubmitButton>
              </form>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {client.email
                  ? `Login will be created using ${client.email} with the default password Client@123. The client will be required to change it on first login.`
                  : "Add an email address to this client's profile before creating a portal login."}
              </p>
              <form action={createPortalUser.bind(null, client.id)}>
                <Button type="submit" disabled={!client.email}>
                  Create Portal Login
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
