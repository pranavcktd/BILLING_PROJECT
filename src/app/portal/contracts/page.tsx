import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-guard";
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
  SIGNED: "default",
  CANCELLED: "destructive",
};

export default async function PortalContractsPage() {
  const session = await requireClient();

  const contracts = await prisma.contract.findMany({
    where: { clientId: session.user.clientId! },
    orderBy: { createdAt: "desc" },
    include: { matter: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Contracts</h1>
      <Card>
        <CardContent className="p-0">
          {contracts.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No contracts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Matter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.matter?.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <a
                            href={`/api/contracts/${c.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          />
                        }
                      >
                        View
                      </Button>
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
