import { prismaUnscoped } from "@/lib/prisma";

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export async function getPlatformAnalytics() {
  const [
    organizations,
    userCounts,
    invoiceAgg,
    invoiceCount,
    paymentAgg,
    clientCount,
  ] = await Promise.all([
    prismaUnscoped.organization.findMany({
      select: { id: true, name: true, subscriptionStatus: true, createdAt: true },
    }),
    prismaUnscoped.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prismaUnscoped.invoice.aggregate({ _sum: { total: true } }),
    prismaUnscoped.invoice.count(),
    prismaUnscoped.payment.aggregate({ _sum: { amount: true } }),
    prismaUnscoped.client.count(),
  ]);

  const activeOrgs = organizations.filter((o) => o.subscriptionStatus === "ACTIVE").length;
  const suspendedOrgs = organizations.length - activeOrgs;

  const roleCounts: Record<string, number> = {};
  for (const row of userCounts) {
    roleCounts[row.role] = row._count._all;
  }

  // Organizations onboarded per month, last 12 months.
  const now = new Date();
  const months: { key: string; label: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d), value: 0 });
  }
  const monthIndex = new Map(months.map((m) => [m.key, m]));
  for (const org of organizations) {
    const key = `${org.createdAt.getFullYear()}-${org.createdAt.getMonth()}`;
    const bucket = monthIndex.get(key);
    if (bucket) bucket.value += 1;
  }

  return {
    totalOrganizations: organizations.length,
    activeOrgs,
    suspendedOrgs,
    admins: roleCounts.ADVOCATE ?? 0,
    staff: roleCounts.STAFF ?? 0,
    clientLogins: roleCounts.CLIENT ?? 0,
    superAdmins: roleCounts.SUPER_ADMIN ?? 0,
    totalClients: clientCount,
    totalInvoices: invoiceCount,
    totalInvoiceValue: Number(invoiceAgg._sum.total ?? 0),
    totalCollected: Number(paymentAgg._sum.amount ?? 0),
    organizationsPerMonth: months.map((m) => ({ label: m.label, value: m.value })),
  };
}
