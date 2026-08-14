import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function login(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // NextAuth wraps whatever `authorize()` throws as a CredentialsSignin
      // AuthError; the original message (e.g. "subscription inactive") is
      // preserved on `.cause.err.message` — surface it when present so a
      // suspended-org login shows a real reason, not a generic one.
      const cause = error.cause as { err?: Error } | undefined;
      const message = cause?.err?.message;
      if (message && message !== "CredentialsSignin") {
        redirect(`/login?error=${encodeURIComponent(message)}`);
      }
      redirect("/login?error=invalid");
    }
    throw error;
  }

  // signIn() sets the session cookie on the outgoing response, which isn't
  // visible to auth() within this same request — look the user up directly
  // to decide where to send them instead of relying on a fresh session read.
  const user =
    typeof email === "string"
      ? await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      : null;

  if (user?.mustChangePassword) {
    redirect(user.role === "CLIENT" ? "/portal/change-password" : "/change-password");
  }
  if (user?.role === "CLIENT") redirect("/portal");
  if (user?.role === "SUPER_ADMIN") redirect("/super-admin");
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; passwordChanged?: string }>;
}) {
  const { error, passwordChanged } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">
                {error === "invalid" ? "Invalid email or password." : error}
              </p>
            )}
            {passwordChanged && !error && (
              <p className="text-sm text-[#0ca30c]">
                Password changed successfully. Please sign in again.
              </p>
            )}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
