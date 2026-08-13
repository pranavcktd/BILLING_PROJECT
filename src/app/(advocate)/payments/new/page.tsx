import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { recordPayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentFormFields } from "@/components/payment-form-fields";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  await requireAdvocate();
  const { invoiceId } = await searchParams;

  if (!invoiceId) notFound();

  const [invoice, bankAccounts] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    }),
    prisma.bankAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, bankName: true, accountNumber: true, isDefault: true },
    }),
  ]);

  if (!invoice) notFound();

  const balance = invoice.total.minus(invoice.amountPaid);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Record Payment</h1>
        <p className="text-sm text-muted-foreground">
          {invoice.number} — {invoice.client.name} — Balance due ₹{balance.toFixed(2)}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={recordPayment} className="space-y-4">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <PaymentFormFields
              bankAccounts={bankAccounts}
              defaultValues={{ amount: balance.toFixed(2), method: "UPI", paidOn: today }}
            />
            <Button type="submit">Record Payment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
