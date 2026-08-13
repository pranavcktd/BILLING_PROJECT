import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { deletePayment } from "@/lib/actions/payments";
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

export default async function PaymentsPage() {
  await requireAdvocate();

  const payments = await prisma.payment.findMany({
    orderBy: { paidOn: "desc" },
    include: { invoice: { include: { client: true } }, bankAccount: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <ExportCsvButton href="/api/export/payments" />
      </div>

      <Card>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No payments recorded yet. Record payments from an invoice&apos;s detail page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => {
                  const actions: RowAction[] = [
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
                        <Link href={`/invoices/${p.invoice.id}`} className="hover:underline">
                          {p.invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>{p.invoice.client.name}</TableCell>
                      <TableCell>
                        {p.method.replace("_", " ")}
                        {p.bankAccount && (
                          <span className="text-muted-foreground"> ({p.bankAccount.bankName})</span>
                        )}
                      </TableCell>
                      <TableCell>{p.referenceNumber ?? "—"}</TableCell>
                      <TableCell className="text-right">₹{p.amount.toFixed(2)}</TableCell>
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
