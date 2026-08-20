import { requireModulePermission } from "@/lib/auth-guard";
import { createClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewClientPage() {
  await requireModulePermission("clients", "MANAGE");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">New Client</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN (optional)</Label>
                <Input id="gstin" name="gstin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tan">TAN (optional)</Label>
                <Input id="tan" name="tan" placeholder="For government departments" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <Button type="submit">Create Client</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
