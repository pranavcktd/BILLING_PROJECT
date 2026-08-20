import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { prismaUnscoped } from "@/lib/prisma";
import { getOrgBackupData, serializeBackupJson, backupFilename } from "@/lib/backup";
import { buildBackupWorkbook } from "@/lib/backup-xlsx";
import { buildBackupSql } from "@/lib/backup-sql";

export async function GET(request: NextRequest) {
  await requireSuperAdmin();
  const organizationId = request.nextUrl.searchParams.get("orgId");
  const format = request.nextUrl.searchParams.get("format") ?? "json";

  if (!organizationId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }
  const org = await prismaUnscoped.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const data = await getOrgBackupData(organizationId);

  if (format === "xlsx") {
    const buffer = await buildBackupWorkbook(data);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${backupFilename("xlsx")}"`,
      },
    });
  }

  if (format === "sql") {
    const sql = buildBackupSql(data);
    return new NextResponse(sql, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="${backupFilename("sql")}"`,
      },
    });
  }

  const json = serializeBackupJson(data);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${backupFilename("json")}"`,
    },
  });
}
