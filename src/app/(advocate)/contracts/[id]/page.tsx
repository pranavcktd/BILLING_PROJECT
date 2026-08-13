import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { deleteContract, updateContractStatusForm } from "@/lib/actions/contracts";
import { CONTRACT_STATUS_OPTIONS } from "@/lib/status-options";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChangeForm } from "@/components/status-change-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "secondary",
  SIGNED: "default",
  CANCELLED: "destructive",
};

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdvocate();
  const { id } = await params;
  const { error } = await searchParams;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { client: true, matter: true, quotation: true, invoices: true },
  });

  if (!contract) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/clients/${contract.client.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {contract.client.name}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{contract.title}</h1>
            <Badge variant={statusVariant[contract.status]}>{contract.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={`/api/contracts/${contract.id}/pdf`} target="_blank" rel="noreferrer" />}
          >
            View PDF
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/contracts/${contract.id}/edit`} />}
          >
            Edit
          </Button>
          <form action={deleteContract.bind(null, contract.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this contract? This cannot be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {error === "has-records" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          This contract can&apos;t be deleted because invoices have been created from it.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <StatusChangeForm
          action={updateContractStatusForm.bind(null, contract.id)}
          currentStatus={contract.status}
          options={CONTRACT_STATUS_OPTIONS}
          warning={{ kind: "contract", invoiceCount: contract.invoices.length }}
        />
        {contract.status === "SIGNED" && (
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/invoices/new?contractId=${contract.id}`} />}
          >
            Create Invoice
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
              {contract.matter?.title ?? "—"}
            </div>
            {contract.quotation && (
              <div>
                <span className="text-muted-foreground">From Quotation: </span>
                <Link
                  href={`/quotations/${contract.quotation.id}`}
                  className="hover:underline"
                >
                  {contract.quotation.number}
                </Link>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Created: </span>
              {contract.createdAt.toLocaleDateString()}
            </div>
            <div>
              <span className="text-muted-foreground">Signed: </span>
              {contract.signedAt?.toLocaleDateString() ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Invoices: </span>
              {contract.invoices.length}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {contract.content}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
