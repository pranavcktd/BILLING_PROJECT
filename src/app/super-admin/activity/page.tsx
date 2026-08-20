import { requireSuperAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SuperAdminActivityPage() {
  await requireSuperAdmin();

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Log</h1>
        <p className="text-sm text-muted-foreground">
          The most recent 200 Super Admin actions across the platform.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {entry.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{entry.actorEmail}</TableCell>
                    <TableCell className="text-sm font-medium">{entry.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.targetLabel ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.details ?? "—"}
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
