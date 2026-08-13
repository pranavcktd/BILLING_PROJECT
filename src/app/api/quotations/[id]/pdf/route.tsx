import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireDocumentAccess } from "@/lib/auth-guard";
import { getFirmProfile } from "@/lib/firm-profile";
import { QuotationPdf } from "@/lib/pdf/quotation-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: true,
      matter: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await requireDocumentAccess(quotation.clientId);
  const firm = await getFirmProfile();

  const buffer = await renderToBuffer(
    <QuotationPdf
      number={quotation.number}
      issueDate={quotation.issueDate.toLocaleDateString("en-IN")}
      validUntil={quotation.validUntil?.toLocaleDateString("en-IN") ?? null}
      status={quotation.status}
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
        name: quotation.client.name,
        email: quotation.client.email,
        phone: quotation.client.phone,
        address: quotation.client.address,
        gstin: quotation.client.gstin,
      }}
      matter={quotation.matter ? { title: quotation.matter.title } : null}
      items={quotation.items.map((item) => ({
        description: item.description,
        quantity: item.quantity.toFixed(2),
        rate: item.rate.toFixed(2),
        amount: item.amount.toFixed(2),
      }))}
      subtotal={quotation.subtotal.toFixed(2)}
      taxAmount={quotation.taxAmount.toFixed(2)}
      total={quotation.total.toFixed(2)}
      notes={quotation.notes}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quotation.number.replace(/\//g, "-")}.pdf"`,
    },
  });
}
