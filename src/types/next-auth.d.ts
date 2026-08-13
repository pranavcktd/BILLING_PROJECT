import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADVOCATE" | "CLIENT";
    clientId: string | null;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: "ADVOCATE" | "CLIENT";
      clientId: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADVOCATE" | "CLIENT";
    clientId: string | null;
    mustChangePassword: boolean;
  }
}
