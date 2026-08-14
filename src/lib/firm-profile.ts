import { prisma } from "@/lib/prisma";
import { getCurrentOrgId } from "@/lib/tenant-context";

export async function getFirmProfile() {
  const profile = await prisma.firmProfile.findUnique({
    where: { organizationId: await getCurrentOrgId() },
  });
  return (
    profile ?? {
      id: "",
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
