import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/lib/auth-guard";
import { generateInvoicePdfBuffer } from "@/lib/pdf/generate-invoice-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await generateInvoicePdfBuffer(id);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await requireDocumentAccess(result.invoice.clientId);

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.invoice.number.replace(/\//g, "-")}.pdf"`,
    },
  });
}
