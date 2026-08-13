import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { deleteExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
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

export default async function ExpensesPage() {
  await requireAdvocate();

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Total recorded: ₹{total.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton href="/api/export/expenses" />
          <Button nativeButton={false} render={<Link href="/expenses/new" />}>
            New Expense
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No expenses recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => {
                  const actions: RowAction[] = [
                    { type: "link", label: "Edit", href: `/expenses/${e.id}/edit` },
                    {
                      type: "action",
                      label: "Delete",
                      action: deleteExpense.bind(null, e.id),
                      confirmMessage: "Delete this expense record?",
                      destructive: true,
                    },
                  ];
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{e.date.toLocaleDateString()}</TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>{e.vendor ?? "—"}</TableCell>
                      <TableCell className="text-right">₹{e.amount.toFixed(2)}</TableCell>
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
