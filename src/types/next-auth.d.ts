import { DefaultSession } from "next-auth";
import type { ModuleName, PermissionLevel } from "@/lib/permissions";

type Role = "ADVOCATE" | "CLIENT" | "SUPER_ADMIN" | "STAFF";
type PermissionMap = Partial<Record<ModuleName, PermissionLevel>>;

declare module "next-auth" {
  interface User {
    role: Role;
    clientId: string | null;
    organizationId: string | null;
    mustChangePassword?: boolean;
    permissions?: PermissionMap;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      clientId: string | null;
      organizationId: string | null;
      mustChangePassword: boolean;
      permissions: PermissionMap;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    clientId: string | null;
    organizationId: string | null;
    mustChangePassword: boolean;
    permissions: PermissionMap;
  }
}
