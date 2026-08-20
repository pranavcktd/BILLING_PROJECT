import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Edge-safe auth config used by middleware. Must not import Prisma or
// bcrypt (Node-only) — the real `authorize` implementation lives in
// auth.ts and is only used by the Node.js runtime (route handlers,
// server components/actions).
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async () => null,
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.clientId = user.clientId ?? null;
        token.organizationId = user.organizationId ?? null;
        token.mustChangePassword = user.mustChangePassword ?? false;
        token.permissions = user.permissions ?? {};
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "ADVOCATE" | "CLIENT" | "SUPER_ADMIN" | "STAFF";
        session.user.clientId = (token.clientId as string | null) ?? null;
        session.user.organizationId = (token.organizationId as string | null) ?? null;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
        session.user.permissions = token.permissions ?? {};
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
