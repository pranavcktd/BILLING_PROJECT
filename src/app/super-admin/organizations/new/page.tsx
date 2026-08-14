import { requireSuperAdmin } from "@/lib/auth-guard";
import { onboardOrganization } from "@/lib/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewOrganizationPage() {
  await requireSuperAdmin();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Onboard New Admin</h1>
        <p className="text-sm text-muted-foreground">
          Creates a new organization and its first Admin login. The login will use the
          default password (Client@123) and must be changed on first sign-in.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onboardOrganization} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization / Firm Name</Label>
              <Input id="organizationName" name="organizationName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">Profession (optional)</Label>
              <Input id="profession" name="profession" placeholder="e.g. Advocate, CA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Name</Label>
              <Input id="adminName" name="adminName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email (login id)</Label>
              <Input id="adminEmail" name="adminEmail" type="email" required />
            </div>
            <Button type="submit">Create Organization</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
