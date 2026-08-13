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
  ACCEPTED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
};

export default async function PortalQuotationsPage() {
  const session = await requireClient();

  const quotations = await prisma.quotation.findMany({
    where: { clientId: session.user.clientId! },
    orderBy: { issueDate: "desc" },
    include: { matter: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Quotations</h1>
      <Card>
        <CardContent className="p-0">
          {quotations.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No quotations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Matter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.number}</TableCell>
                    <TableCell>{q.matter?.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[q.status]}>{q.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{q.total.toFixed(2)}</TableCell>
                    <TableCell>{q.issueDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <a
                            href={`/api/quotations/${q.id}/pdf`}
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
