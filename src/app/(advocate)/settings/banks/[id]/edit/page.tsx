import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { updateBankAccount } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditBankAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdvocate();
  const { id } = await params;

  const bank = await prisma.bankAccount.findUnique({ where: { id } });
  if (!bank) notFound();

  async function updateAndRedirect(formData: FormData) {
    "use server";
    await updateBankAccount(bank!.id, formData);
    redirect("/settings");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Edit Bank Account</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAndRedirect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" defaultValue={bank.bankName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Holder Name</Label>
              <Input
                id="accountName"
                name="accountName"
                defaultValue={bank.accountName}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  defaultValue={bank.accountNumber}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input id="ifscCode" name="ifscCode" defaultValue={bank.ifscCode} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch (optional)</Label>
              <Input id="branch" name="branch" defaultValue={bank.branch ?? ""} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={bank.isDefault}
                className="size-4 rounded border-input"
              />
              Set as default payment bank
            </label>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
