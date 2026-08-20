import { redirect } from "next/navigation";
import { requireModulePermission } from "@/lib/auth-guard";
import { createBankAccount } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function createAndRedirect(formData: FormData) {
  "use server";
  await createBankAccount(formData);
  redirect("/settings");
}

export default async function NewBankAccountPage() {
  await requireModulePermission("settings", "MANAGE");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Add Bank Account</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAndRedirect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Holder Name</Label>
              <Input id="accountName" name="accountName" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" name="accountNumber" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input id="ifscCode" name="ifscCode" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch (optional)</Label>
              <Input id="branch" name="branch" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="isDefault"
                className="size-4 rounded border-input"
              />
              Set as default payment bank
            </label>
            <Button type="submit">Add Bank Account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
