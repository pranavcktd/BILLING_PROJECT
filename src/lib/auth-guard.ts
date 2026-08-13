import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdvocate() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADVOCATE") {
    redirect("/login");
  }
  return session;
}

export async function requireClient() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT" || !session.user.clientId) {
    redirect("/login");
  }
  return session;
}

export async function requireDocumentAccess(clientId: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "ADVOCATE") {
    return session;
  }
  if (session.user.role === "CLIENT" && session.user.clientId === clientId) {
    return session;
  }
  redirect("/login");
}
