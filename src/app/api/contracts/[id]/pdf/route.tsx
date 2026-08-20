import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireDocumentAccess } from "@/lib/auth-guard";
import { getFirmProfile } from "@/lib/firm-profile";
import { ContractPdf } from "@/lib/pdf/contract-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { client: true, matter: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await requireDocumentAccess(contract.clientId, "contracts");
  const firm = await getFirmProfile();

  const buffer = await renderToBuffer(
    <ContractPdf
      title={contract.title}
      status={contract.status}
      createdDate={contract.createdAt.toLocaleDateString("en-IN")}
      signedDate={contract.signedAt?.toLocaleDateString("en-IN") ?? null}
      firm={{
        name: firm.name,
        address: firm.address,
        phone: firm.phone,
        email: firm.email,
        website: firm.website,
        gstin: firm.gstin,
      }}
      signatureImage={firm.signatureImage}
      client={{
        name: contract.client.name,
        email: contract.client.email,
        phone: contract.client.phone,
        address: contract.client.address,
      }}
      matter={contract.matter ? { title: contract.matter.title } : null}
      content={contract.content}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${contract.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
    },
  });
}
