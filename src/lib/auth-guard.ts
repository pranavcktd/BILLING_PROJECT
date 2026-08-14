import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdvocate() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADVOCATE" || !session.user.organizationId) {
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

export async function requireDocumentAccess(clientId: string) {
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
  redirect("/login");
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  return session;
}
