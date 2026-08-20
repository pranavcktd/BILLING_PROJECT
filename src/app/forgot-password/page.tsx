import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/forgot-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If an account exists for that email, a temporary password has been sent.
                Sign in with it and you&apos;ll be required to set a new password.
              </p>
              <Button className="w-full" nativeButton={false} render={<Link href="/login" />}>
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form action={requestPasswordReset} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your account email. If it exists, we&apos;ll send a temporary
                password you can sign in with.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <Button type="submit" className="w-full">
                Send Temporary Password
              </Button>
              <Link href="/login" className="block text-center text-sm text-muted-foreground hover:underline">
                Back to Sign In
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
