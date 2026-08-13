import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-guard";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "outline",
};

export default async function PortalInvoicesPage() {
  const session = await requireClient();

  const invoices = await prisma.invoice.findMany({
    where: { clientId: session.user.clientId! },
    orderBy: { issueDate: "desc" },
    include: { matter: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
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
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.number}</TableCell>
                      <TableCell>{inv.matter?.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[status]}>
                          {invoiceStatusLabel(status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{inv.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{balance.toFixed(2)}</TableCell>
                      <TableCell>{inv.dueDate?.toLocaleDateString() ?? "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={
                            <a
                              href={`/api/invoices/${inv.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          View
                        </Button>
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
