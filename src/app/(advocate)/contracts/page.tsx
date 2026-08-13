import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { deleteContract, setContractStatus } from "@/lib/actions/contracts";
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
  SIGNED: "default",
  CANCELLED: "destructive",
};

export default async function ContractsPage() {
  await requireAdvocate();

  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, matter: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <div className="flex gap-2">
          <ExportCsvButton href="/api/export/contracts" />
          <Button nativeButton={false} render={<Link href="/contracts/new" />}>
            New Contract
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {contracts.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No contracts yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Matter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => {
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
                      <TableCell>{c.client.name}</TableCell>
                      <TableCell>{c.matter?.title ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
