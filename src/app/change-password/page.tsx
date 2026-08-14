import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { changeOwnPassword } from "@/lib/actions/portal-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "CLIENT") {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center space-y-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Change Password</h1>
        {session.user.mustChangePassword && (
          <p className="mt-1 text-sm text-muted-foreground">
            For security, please set a new password before continuing.
          </p>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={changeOwnPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
