import { prisma } from "@/lib/prisma";

export async function getFirmProfile() {
  const profile = await prisma.firmProfile.findUnique({ where: { id: "singleton" } });
  return (
    profile ?? {
      id: "singleton",
      name: "",
      address: null,
      phone: null,
      email: null,
      website: null,
      gstin: null,
      signatureImage: null,
    }
  );
}
