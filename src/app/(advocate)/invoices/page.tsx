import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";
import { deleteInvoice, setInvoiceStatus } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActionsMenu, type RowAction } from "@/components/row-actions-menu";
import { ExportCsvButton } from "@/components/export-csv-button";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "outline",
};

export default async function InvoicesPage() {
  await requireAdvocate();

  const invoices = await prisma.invoice.findMany({
    orderBy: { issueDate: "desc" },
    include: { client: true, matter: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <div className="flex gap-2">
          <ExportCsvButton href="/api/export/invoices" />
          <Button nativeButton={false} render={<Link href="/invoices/new" />}>
            New Invoice
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No invoices yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Matter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const status = displayInvoiceStatus(inv);
                  const balance = inv.total.minus(inv.amountPaid);
                  const actions: RowAction[] = [
                    { type: "link", label: "View", href: `/invoices/${inv.id}` },
                    { type: "link", label: "Edit", href: `/invoices/${inv.id}/edit` },
                  ];
                  if (
                    inv.status === "DRAFT" ||
                    inv.status === "SENT" ||
                    inv.status === "PARTIALLY_PAID"
                  ) {
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
                      <TableCell>{inv.client.name}</TableCell>
                      <TableCell>{inv.matter?.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[status]}>{invoiceStatusLabel(status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{inv.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{balance.toFixed(2)}</TableCell>
                      <TableCell>{inv.dueDate?.toLocaleDateString() ?? "—"}</TableCell>
                      <TableCell>
                        <RowActionsMenu actions={actions} />
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
