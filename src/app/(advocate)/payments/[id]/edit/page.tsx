import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { updatePayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentFormFields } from "@/components/payment-form-fields";

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdvocate();
  const { id } = await params;

  const [payment, bankAccounts] = await Promise.all([
    prisma.payment.findUnique({
      where: { id },
      include: { invoice: { include: { client: true } } },
    }),
    prisma.bankAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, bankName: true, accountNumber: true, isDefault: true },
    }),
  ]);

  if (!payment) notFound();

  const updatePaymentWithId = updatePayment.bind(null, payment.id);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Payment</h1>
        <p className="text-sm text-muted-foreground">
          {payment.invoice.number} — {payment.invoice.client.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePaymentWithId} className="space-y-4">
            <PaymentFormFields
              bankAccounts={bankAccounts}
              defaultValues={{
                amount: payment.amount.toFixed(2),
                method: payment.method,
                bankAccountId: payment.bankAccountId ?? undefined,
                paidOn: payment.paidOn.toISOString().slice(0, 10),
                referenceNumber: payment.referenceNumber ?? undefined,
                notes: payment.notes ?? undefined,
              }}
            />
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
