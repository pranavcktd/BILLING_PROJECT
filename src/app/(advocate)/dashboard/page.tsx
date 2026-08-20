import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdvocateOrStaff } from "@/lib/auth-guard";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";
import {
  getRevenueByYear,
  getRevenueByMatter,
  getPaidUnpaidSummary,
} from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarList } from "@/components/charts/bar-list";
import { StatusAmountRow } from "@/components/charts/status-amount-row";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "outline",
};

export default async function DashboardPage() {
  await requireAdvocateOrStaff();

  const [
    invoices,
    openQuotationCount,
    activeMatterCount,
    recentInvoices,
    revenueByYear,
    revenueByMatter,
    paidUnpaid,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
      select: { id: true, status: true, dueDate: true, total: true, amountPaid: true },
    }),
    prisma.quotation.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    prisma.matter.count({ where: { status: "OPEN" } }),
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      take: 5,
      include: { client: true },
    }),
    getRevenueByYear(),
    getRevenueByMatter(5),
    getPaidUnpaidSummary(),
  ]);

  const outstanding = invoices.reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amountPaid)),
    0
  );
  const overdueCount = invoices.filter(
    (inv) => displayInvoiceStatus(inv) === "OVERDUE"
  ).length;

  const currentYearRevenue = revenueByYear.at(-1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/reports" className="text-sm text-primary hover:underline">
          View full reports →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₹{outstanding.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Link href="/invoices" className="hover:underline">
                Overdue Invoices
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{overdueCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Link href="/quotations" className="hover:underline">
                Open Quotations
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{openQuotationCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeMatterCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paid vs Unpaid</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <StatusAmountRow
            items={[
              { label: "Collected", amount: paidUnpaid.paid, status: "good" },
              { label: "Overdue", amount: paidUnpaid.overdue, status: "critical" },
              { label: "Unpaid (not due)", amount: paidUnpaid.unpaidNotDue, status: "warning" },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Revenue This Year
              {currentYearRevenue ? ` (FY ${currentYearRevenue.year})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BarList
              data={revenueByYear.map((y) => ({ label: y.year, value: y.billed }))}
              valueFormatter={(v) => `₹${v.toFixed(2)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Matters by Billing</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <BarList data={revenueByMatter} valueFormatter={(v) => `₹${v.toFixed(2)}`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentInvoices.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => {
                  const status = displayInvoiceStatus(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${inv.id}`} className="hover:underline">
                          {inv.number}
                        </Link>
                      </TableCell>
                      <TableCell>{inv.client.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[status]}>{invoiceStatusLabel(status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{inv.total.toFixed(2)}</TableCell>
                      <TableCell>{inv.issueDate.toLocaleDateString()}</TableCell>
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
