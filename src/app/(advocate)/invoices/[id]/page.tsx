import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { deleteInvoice, updateInvoiceStatusForm } from "@/lib/actions/invoices";
import { INVOICE_STATUS_OPTIONS } from "@/lib/status-options";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChangeForm } from "@/components/status-change-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deletePayment } from "@/lib/actions/payments";
import { RowActionsMenu, type RowAction } from "@/components/row-actions-menu";
import { SendInvoiceEmailButton } from "@/components/send-invoice-email-button";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "outline",
};


export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModulePermission("invoices", "VIEW");
  const { id } = await params;
  const { error } = await searchParams;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      matter: true,
      contract: true,
      items: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidOn: "desc" }, include: { bankAccount: true } },
      bankAccounts: { include: { bankAccount: true } },
    },
  });

  if (!invoice) notFound();

  const status = displayInvoiceStatus(invoice);
  const balance = invoice.total.minus(invoice.amountPaid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/clients/${invoice.client.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {invoice.client.name}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{invoice.number}</h1>
            <Badge variant={statusVariant[status]}>{invoiceStatusLabel(status)}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer" />}
          >
            View PDF
          </Button>
          <SendInvoiceEmailButton invoiceId={invoice.id} clientEmail={invoice.client.email} />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/invoices/${invoice.id}/edit`} />}
          >
            Edit
          </Button>
          <form action={deleteInvoice.bind(null, invoice.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this invoice? This cannot be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {error === "has-records" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          This invoice can&apos;t be deleted because it has recorded payments.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusChangeForm
          action={updateInvoiceStatusForm.bind(null, invoice.id)}
          currentStatus={invoice.status}
          options={INVOICE_STATUS_OPTIONS}
          warning={{ kind: "invoice", amountPaid: Number(invoice.amountPaid) }}
        />
        {balance.greaterThan(0) && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && (
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/payments/new?invoiceId=${invoice.id}`} />}
          >
            Record Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Matter: </span>
              {invoice.matter?.title ?? "—"}
            </div>
            {invoice.contract && (
              <div>
                <span className="text-muted-foreground">Contract: </span>
                <Link href={`/contracts/${invoice.contract.id}`} className="hover:underline">
                  {invoice.contract.title}
                </Link>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Issued: </span>
              {invoice.issueDate.toLocaleDateString()}
            </div>
            <div>
              <span className="text-muted-foreground">Due: </span>
              {invoice.dueDate?.toLocaleDateString() ?? "—"}
            </div>
            {invoice.bankAccounts.length > 0 && (
              <div>
                <span className="text-muted-foreground">Bank(s): </span>
                {invoice.bankAccounts
                  .map(
                    (b) =>
                      `${b.bankAccount.bankName}${b.isPrimary && invoice.bankAccounts.length > 1 ? " (Default)" : ""}`
                  )
                  .join(", ")}
              </div>
            )}
            {invoice.notes && (
              <div>
                <span className="text-muted-foreground">Notes: </span>
                {invoice.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity.toString()}</TableCell>
                    <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end p-4">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.gstEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CGST</span>
                      <span>₹{invoice.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SGST</span>
                      <span>₹{invoice.sgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IGST</span>
                      <span>₹{invoice.igst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>₹{invoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>₹{invoice.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due</span>
                  <span>₹{balance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.payments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p) => {
                  const paymentActions: RowAction[] = [
                    { type: "link", label: "Edit", href: `/payments/${p.id}/edit` },
                    {
                      type: "action",
                      label: "Delete",
                      action: deletePayment.bind(null, p.id),
                      confirmMessage:
                        "Delete this payment record? The invoice balance will be recalculated.",
                      destructive: true,
                    },
                  ];
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.paidOn.toLocaleDateString()}</TableCell>
                      <TableCell>
                        {p.method.replace("_", " ")}
                        {p.bankAccount && (
                          <span className="text-muted-foreground"> ({p.bankAccount.bankName})</span>
                        )}
                      </TableCell>
                      <TableCell>{p.referenceNumber ?? "—"}</TableCell>
                      <TableCell className="text-right">₹{p.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <RowActionsMenu actions={paymentActions} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
