import { prisma } from "@/lib/prisma";

export async function logActivity(params: {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  details?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      targetLabel: params.targetLabel ?? null,
      details: params.details ?? null,
    },
  });
}
