import { requireAdvocate } from "@/lib/auth-guard";
import {
  getRevenueByYear,
  getRevenueByMatter,
  getRevenueByClient,
  getPaidUnpaidSummary,
  getAgingReport,
  getProfitLossByYear,
} from "@/lib/reports";
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
import { BarList } from "@/components/charts/bar-list";
import { StatusAmountRow } from "@/components/charts/status-amount-row";

const AGING_LABELS: Record<string, string> = {
  current: "Not Yet Due",
  d1_30: "1–30 Days",
  d31_60: "31–60 Days",
  d61_90: "61–90 Days",
  d90plus: "90+ Days",
};

export default async function ReportsPage() {
  await requireAdvocate();

  const [revenueByYear, revenueByMatter, revenueByClient, paidUnpaid, aging, profitLoss] =
    await Promise.all([
      getRevenueByYear(),
      getRevenueByMatter(),
      getRevenueByClient(),
      getPaidUnpaidSummary(),
      getAgingReport(),
      getProfitLossByYear(),
    ]);

  const currency = (v: number) => `₹${v.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Revenue, billing breakdowns, outstanding aging, and profit &amp; loss.
        </p>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="matters">Matters</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="pnl">Profit &amp; Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4 space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue by Financial Year</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {revenueByYear.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Financial Year</TableHead>
                      <TableHead className="text-right">Billed</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByYear.map((y) => (
                      <TableRow key={y.year}>
                        <TableCell className="font-medium">{y.year}</TableCell>
                        <TableCell className="text-right">{currency(y.billed)}</TableCell>
                        <TableCell className="text-right">{currency(y.collected)}</TableCell>
                        <TableCell className="text-right">
                          {currency(y.billed - y.collected)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Highest-Billing Clients</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <BarList data={revenueByClient} valueFormatter={currency} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matters" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Highest-Billing Matters</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <BarList data={revenueByMatter} valueFormatter={currency} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="mt-4 space-y-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bucket</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(aging).map(([key, bucket]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{AGING_LABELS[key]}</TableCell>
                      <TableCell className="text-right">{bucket.count}</TableCell>
                      <TableCell className="text-right">{currency(bucket.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {aging.d90plus.count > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-destructive">
                  90+ Days Overdue — Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aging.d90plus.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.number}</TableCell>
                        <TableCell>{inv.client}</TableCell>
                        <TableCell>{inv.dueDate?.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{currency(inv.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pnl" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profit &amp; Loss by Financial Year</CardTitle>
              <p className="text-xs text-muted-foreground">
                Revenue = payments collected. Profit = Revenue − Expenses.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {profitLoss.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Financial Year</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitLoss.map((p) => (
                      <TableRow key={p.year}>
                        <TableCell className="font-medium">{p.year}</TableCell>
                        <TableCell className="text-right">{currency(p.revenue)}</TableCell>
                        <TableCell className="text-right">{currency(p.expenses)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            p.profit >= 0 ? "text-[#0ca30c]" : "text-destructive"
                          }`}
                        >
                          {currency(p.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
