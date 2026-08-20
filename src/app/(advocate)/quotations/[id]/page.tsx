import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireModulePermission } from "@/lib/auth-guard";
import {
  deleteQuotation,
  updateQuotationStatusForm,
  convertQuotationToContract,
} from "@/lib/actions/quotations";
import { QUOTATION_STATUS_OPTIONS } from "@/lib/status-options";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChangeForm } from "@/components/status-change-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
};


export default async function QuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireModulePermission("quotations", "VIEW");
  const { id } = await params;
  const { error } = await searchParams;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: true,
      matter: true,
      items: { orderBy: { sortOrder: "asc" } },
      contracts: true,
    },
  });

  if (!quotation) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/clients/${quotation.client.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {quotation.client.name}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{quotation.number}</h1>
            <Badge variant={statusVariant[quotation.status]}>{quotation.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={`/api/quotations/${quotation.id}/pdf`} target="_blank" rel="noreferrer" />}
          >
            View PDF
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/quotations/${quotation.id}/edit`} />}
          >
            Edit
          </Button>
          <form action={deleteQuotation.bind(null, quotation.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this quotation? This cannot be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {error === "has-records" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          This quotation can&apos;t be deleted because a contract has been created from it.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusChangeForm
          action={updateQuotationStatusForm.bind(null, quotation.id)}
          currentStatus={quotation.status}
          options={QUOTATION_STATUS_OPTIONS}
          warning={{ kind: "quotation", hasContract: quotation.contracts.length > 0 }}
        />
        {quotation.status === "ACCEPTED" && quotation.contracts.length === 0 && (
          <form action={convertQuotationToContract.bind(null, quotation.id)}>
            <Button type="submit" size="sm">
              Convert to Contract
            </Button>
          </form>
        )}
        {quotation.contracts.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            nativeButton={false}
            render={<Link href={`/contracts/${quotation.contracts[0].id}`} />}
          >
            View Contract
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Matter: </span>
              {quotation.matter?.title ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Issued: </span>
              {quotation.issueDate.toLocaleDateString()}
            </div>
            <div>
              <span className="text-muted-foreground">Valid Until: </span>
              {quotation.validUntil?.toLocaleDateString() ?? "—"}
            </div>
            {quotation.notes && (
              <div>
                <span className="text-muted-foreground">Notes: </span>
                {quotation.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity.toString()}</TableCell>
                    <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end p-4">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{quotation.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{quotation.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>₹{quotation.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
