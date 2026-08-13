import { prisma } from "@/lib/prisma";
import { requireAdvocate } from "@/lib/auth-guard";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  await requireAdvocate();
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const csv = toCsv(clients, [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "address", header: "Address" },
    { key: "gstin", header: "GSTIN" },
    { key: "notes", header: "Notes" },
    { header: "Created", value: (r) => r.createdAt.toLocaleDateString() },
  ]);

  return csvResponse(csv, "clients.csv");
}
