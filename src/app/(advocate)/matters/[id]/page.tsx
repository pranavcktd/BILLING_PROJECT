import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { deleteMatter } from "@/lib/actions/matters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const matterStatusVariant: Record<string, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  ON_HOLD: "secondary",
  CLOSED: "outline",
};

export default async function MatterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdvocate();
  const { id } = await params;
  const { error } = await searchParams;

  const matter = await prisma.matter.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!matter) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/clients/${matter.client.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {matter.client.name}
          </Link>
          <h1 className="text-2xl font-semibold">{matter.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/matters/${matter.id}/edit`} />}
          >
            Edit
          </Button>
          <form action={deleteMatter.bind(null, matter.id)}>
            <ConfirmSubmitButton confirmMessage="Delete this matter? This cannot be undone.">
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      {error === "has-records" && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          This matter can&apos;t be deleted because it has quotations,
          contracts, or invoices linked to it.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Status: </span>
            <Badge variant={matterStatusVariant[matter.status]}>
              {matter.status.replace("_", " ")}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Description: </span>
            {matter.description ?? "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Created: </span>
            {matter.createdAt.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
