import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { deleteClient } from "@/lib/actions/clients";
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
import { RowActionsMenu } from "@/components/row-actions-menu";
import { ExportCsvButton } from "@/components/export-csv-button";

export default async function ClientsPage() {
  await requireAdvocate();

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { matters: true, invoices: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <div className="flex gap-2">
          <ExportCsvButton href="/api/export/clients" />
          <Button variant="outline" nativeButton={false} render={<Link href="/clients/import" />}>
            Import
          </Button>
          <Button nativeButton={false} render={<Link href="/clients/new" />}>
            New Client
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No clients yet. Add your first client to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Matters</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${client.id}`}
                        className="hover:underline"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell>{client.email ?? "—"}</TableCell>
                    <TableCell>{client.phone ?? "—"}</TableCell>
                    <TableCell>{client._count.matters}</TableCell>
                    <TableCell>{client._count.invoices}</TableCell>
                    <TableCell>
                      <RowActionsMenu
                        actions={[
                          { type: "link", label: "View", href: `/clients/${client.id}` },
                          { type: "link", label: "Edit", href: `/clients/${client.id}/edit` },
                          {
                            type: "action",
                            label: "Delete",
                            action: deleteClient.bind(null, client.id),
                            confirmMessage: "Delete this client? This cannot be undone.",
                            destructive: true,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
