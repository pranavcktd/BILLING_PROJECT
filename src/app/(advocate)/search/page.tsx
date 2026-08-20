import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdvocateOrStaff } from "@/lib/auth-guard";
import { GlobalSearchBar } from "@/components/global-search-bar";
import { displayInvoiceStatus, invoiceStatusLabel } from "@/lib/invoice-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdvocateOrStaff();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Search</h1>
        <GlobalSearchBar />
        <p className="text-sm text-muted-foreground">
          Search across clients, quotations, contracts, and invoices by name or number.
        </p>
      </div>
    );
  }

  const ci = { contains: query, mode: "insensitive" as const };

  const [clients, quotations, contracts, invoices] = await Promise.all([
    prisma.client.findMany({
      where: { OR: [{ name: ci }, { email: ci }, { phone: ci }] },
      take: 15,
    }),
    prisma.quotation.findMany({
      where: { OR: [{ number: ci }, { client: { name: ci } }] },
      include: { client: true },
      orderBy: { issueDate: "desc" },
      take: 15,
    }),
    prisma.contract.findMany({
      where: { OR: [{ title: ci }, { client: { name: ci } }] },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.invoice.findMany({
      where: { OR: [{ number: ci }, { client: { name: ci } }] },
      include: { client: true },
      orderBy: { issueDate: "desc" },
      take: 15,
    }),
  ]);

  const totalResults =
    clients.length + quotations.length + contracts.length + invoices.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Search</h1>
      <GlobalSearchBar defaultValue={query} />

      {totalResults === 0 ? (
        <p className="text-sm text-muted-foreground">
          No results found for &quot;{query}&quot;.
        </p>
      ) : (
        <div className="space-y-6">
          {clients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Clients ({clients.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {clients.map((c) => (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}`}
                    className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.email && <span className="text-muted-foreground"> — {c.email}</span>}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoices ({invoices.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {invoices.map((inv) => {
                  const status = displayInvoiceStatus(inv);
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span>
                        <span className="font-medium">{inv.number}</span>
                        <span className="text-muted-foreground"> — {inv.client.name}</span>
                      </span>
                      <Badge variant="outline">{invoiceStatusLabel(status)}</Badge>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {quotations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quotations ({quotations.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {quotations.map((q2) => (
                  <Link
                    key={q2.id}
                    href={`/quotations/${q2.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span>
                      <span className="font-medium">{q2.number}</span>
                      <span className="text-muted-foreground"> — {q2.client.name}</span>
                    </span>
                    <Badge variant="outline">{q2.status}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {contracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contracts ({contracts.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {contracts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span>
                      <span className="font-medium">{c.title}</span>
                      <span className="text-muted-foreground"> — {c.client.name}</span>
                    </span>
                    <Badge variant="outline">{c.status}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
