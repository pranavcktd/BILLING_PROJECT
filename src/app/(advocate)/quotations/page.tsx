import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { deleteQuotation, setQuotationStatus } from "@/lib/actions/quotations";
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
  ACCEPTED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
};

export default async function QuotationsPage() {
  await requireModulePermission("quotations", "VIEW");

  const quotations = await prisma.quotation.findMany({
    orderBy: { issueDate: "desc" },
    include: { client: true, matter: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quotations</h1>
        <div className="flex gap-2">
          <ExportCsvButton href="/api/export/quotations" />
          <Button nativeButton={false} render={<Link href="/quotations/new" />}>
            New Quotation
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {quotations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No quotations yet.
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
                  <TableHead>Issued</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => {
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
                      <TableCell>{q.client.name}</TableCell>
                      <TableCell>{q.matter?.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[q.status]}>{q.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{q.total.toFixed(2)}
                      </TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
