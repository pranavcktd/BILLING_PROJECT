import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, type ModuleName, type PermissionLevel } from "@/lib/permissions";

export async function requireAdvocate() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADVOCATE" || !session.user.organizationId) {
    redirect("/login");
  }
  return session;
}

// For pages with no single owning module (dashboard, global search) that
// aggregate across everything — any authenticated member of the org's
// advocate-area login (ADVOCATE or STAFF) can reach them; per-module
// permission checks happen deeper down for anything that links out to a
// specific record.
export async function requireAdvocateOrStaff() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADVOCATE" && session.user.role !== "STAFF") ||
    !session.user.organizationId
  ) {
    redirect("/login");
  }
  return session;
}

export async function requireClient() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "CLIENT" ||
    !session.user.clientId ||
    !session.user.organizationId
  ) {
    redirect("/login");
  }
  return session;
}

export async function requireDocumentAccess(clientId: string, module?: ModuleName) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "ADVOCATE" && session.user.organizationId) {
    return session;
  }
  if (session.user.role === "CLIENT" && session.user.clientId === clientId && session.user.organizationId) {
    return session;
  }
  if (session.user.role === "STAFF" && session.user.organizationId && module) {
    const allowed = await staffHasPermission(session.user.id, module, "VIEW");
    if (allowed) return session;
  }
  redirect("/login");
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  return session;
}

// The action-layer authorization decision for a STAFF user always reads
// current DB state rather than trusting the JWT-cached permissions map — an
// Admin revoking access needs that to take effect on the very next write,
// not at the staff member's next login. Middleware, by contrast, is stuck
// with the JWT snapshot (edge runtime, no Prisma) and only gates coarse
// page-reachability; this is what actually authorizes each read/write.
async function staffHasPermission(userId: string, module: ModuleName, minLevel: PermissionLevel) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { permissions: true, isActive: true },
  });
  if (!user?.isActive) return false;
  return hasPermission(user.permissions, module, minLevel);
}

// Replaces requireAdvocate() on pages/actions that belong to a specific
// module: ADVOCATE always has full access; STAFF needs at least `minLevel`
// on that module, checked fresh against the DB on every call (see above).
export async function requireModulePermission(module: ModuleName, minLevel: PermissionLevel) {
  const session = await auth();
  if (!session?.user || !session.user.organizationId) {
    redirect("/login");
  }
  if (session.user.role === "ADVOCATE") {
    return session;
  }
  if (session.user.role === "STAFF") {
    const allowed = await staffHasPermission(session.user.id, module, minLevel);
    if (allowed) return session;
    throw new Error("You don't have permission to do that.");
  }
  redirect("/login");
}
