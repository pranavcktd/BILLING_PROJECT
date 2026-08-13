import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalOverviewPage() {
  const session = await requireClient();
  const clientId = session.user.clientId!;

  const [pendingQuotations, unsignedContracts, invoices] = await Promise.all([
    prisma.quotation.count({ where: { clientId, status: { in: ["DRAFT", "SENT"] } } }),
    prisma.contract.count({ where: { clientId, status: { in: ["DRAFT", "SENT"] } } }),
    prisma.invoice.findMany({
      where: { clientId, status: { notIn: ["DRAFT", "CANCELLED"] } },
      select: { total: true, amountPaid: true },
    }),
  ]);

  const outstanding = invoices.reduce(
    (sum, inv) => sum + Number(inv.total) - Number(inv.amountPaid),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₹{outstanding.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Link href="/portal/quotations" className="hover:underline">
                Pending Quotations
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{pendingQuotations}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Link href="/portal/contracts" className="hover:underline">
                Contracts Awaiting Signature
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{unsignedContracts}</CardContent>
        </Card>
      </div>
    </div>
  );
}
