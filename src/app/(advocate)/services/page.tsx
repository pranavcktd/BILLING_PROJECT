import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import { deleteService, toggleServiceActive } from "@/lib/actions/services";
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

export default async function ServicesPage() {
  await requireModulePermission("services", "VIEW");

  const services = await prisma.serviceItem.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Services &amp; Products</h1>
          <p className="text-sm text-muted-foreground">
            Your standard offerings and pricing, selectable when adding line items to a quotation or invoice.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/services/import" />}>
            Import
          </Button>
          <Button nativeButton={false} render={<Link href="/services/new" />}>
            New Item
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No services or products yet. Add your regularly billed items here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => {
                  const actions: RowAction[] = [
                    { type: "link", label: "Edit", href: `/services/${s.id}/edit` },
                    {
                      type: "action",
                      label: s.isActive ? "Deactivate" : "Activate",
                      action: toggleServiceActive.bind(null, s.id),
                    },
                    {
                      type: "action",
                      label: "Delete",
                      action: deleteService.bind(null, s.id),
                      confirmMessage: "Delete this item? This cannot be undone.",
                      destructive: true,
                    },
                  ];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.description ?? "—"}
                      </TableCell>
                      <TableCell>{s.unit ?? "—"}</TableCell>
                      <TableCell className="text-right">₹{s.rate.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={s.isActive ? "default" : "outline"}>
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
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
