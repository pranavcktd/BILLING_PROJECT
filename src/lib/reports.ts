import { prisma } from "@/lib/prisma";
import { financialYearLabel } from "@/lib/financial-year";

export async function getRevenueByYear() {
  const invoices = await prisma.invoice.findMany({
    where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
    select: { issueDate: true, total: true, amountPaid: true },
  });

  const byYear = new Map<string, { billed: number; collected: number }>();
  for (const inv of invoices) {
    const fy = financialYearLabel(inv.issueDate);
    const entry = byYear.get(fy) ?? { billed: 0, collected: 0 };
    entry.billed += Number(inv.total);
    entry.collected += Number(inv.amountPaid);
    byYear.set(fy, entry);
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, v]) => ({ year, ...v }));
}

export async function getRevenueByMatter(limit = 8) {
  const invoices = await prisma.invoice.findMany({
    where: { status: { notIn: ["DRAFT", "CANCELLED"] }, matterId: { not: null } },
    select: { total: true, matter: { select: { title: true } } },
  });

  const byMatter = new Map<string, number>();
  for (const inv of invoices) {
    const title = inv.matter?.title ?? "Unassigned";
    byMatter.set(title, (byMatter.get(title) ?? 0) + Number(inv.total));
  }

  return [...byMatter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export async function getRevenueByClient(limit = 8) {
  const invoices = await prisma.invoice.findMany({
    where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
    select: { total: true, client: { select: { name: true } } },
  });

  const byClient = new Map<string, number>();
  for (const inv of invoices) {
    byClient.set(inv.client.name, (byClient.get(inv.client.name) ?? 0) + Number(inv.total));
  }

  return [...byClient.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

export async function getPaidUnpaidSummary() {
  const invoices = await prisma.invoice.findMany({
    where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
    select: { status: true, total: true, amountPaid: true, dueDate: true },
  });

  let paid = 0;
  let overdue = 0;
  let unpaidNotDue = 0;

  const now = Date.now();
  for (const inv of invoices) {
    const balance = Number(inv.total) - Number(inv.amountPaid);
    paid += Number(inv.amountPaid);
    if (balance <= 0) continue;
    const isOverdue = inv.dueDate !== null && inv.dueDate.getTime() < now;
    if (isOverdue) {
      overdue += balance;
    } else {
      unpaidNotDue += balance;
    }
  }

  return { paid, overdue, unpaidNotDue };
}

export async function getAgingReport() {
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "PARTIALLY_PAID"] } },
    select: {
      id: true,
      number: true,
      dueDate: true,
      total: true,
      amountPaid: true,
      client: { select: { name: true } },
    },
  });

  const buckets = {
    current: [] as typeof invoices,
    d1_30: [] as typeof invoices,
    d31_60: [] as typeof invoices,
    d61_90: [] as typeof invoices,
    d90plus: [] as typeof invoices,
  };

  const now = Date.now();
  const DAY = 1000 * 60 * 60 * 24;

  for (const inv of invoices) {
    const balance = Number(inv.total) - Number(inv.amountPaid);
    if (balance <= 0) continue;
    if (!inv.dueDate || inv.dueDate.getTime() >= now) {
      buckets.current.push(inv);
      continue;
    }
    const daysOverdue = Math.floor((now - inv.dueDate.getTime()) / DAY);
    if (daysOverdue <= 30) buckets.d1_30.push(inv);
    else if (daysOverdue <= 60) buckets.d31_60.push(inv);
    else if (daysOverdue <= 90) buckets.d61_90.push(inv);
    else buckets.d90plus.push(inv);
  }

  const summarize = (rows: typeof invoices) => ({
    count: rows.length,
    amount: rows.reduce((sum, r) => sum + (Number(r.total) - Number(r.amountPaid)), 0),
    invoices: rows.map((r) => ({
      id: r.id,
      number: r.number,
      client: r.client.name,
      balance: Number(r.total) - Number(r.amountPaid),
      dueDate: r.dueDate,
    })),
  });

  return {
    current: summarize(buckets.current),
    d1_30: summarize(buckets.d1_30),
    d31_60: summarize(buckets.d31_60),
    d61_90: summarize(buckets.d61_90),
    d90plus: summarize(buckets.d90plus),
  };
}

export async function getProfitLossByYear() {
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { notIn: ["DRAFT", "CANCELLED"] } },
      select: { issueDate: true, amountPaid: true },
    }),
    prisma.expense.findMany({ select: { date: true, amount: true } }),
  ]);

  const byYear = new Map<string, { revenue: number; expenses: number }>();

  for (const inv of invoices) {
    const fy = financialYearLabel(inv.issueDate);
    const entry = byYear.get(fy) ?? { revenue: 0, expenses: 0 };
    entry.revenue += Number(inv.amountPaid);
    byYear.set(fy, entry);
  }

  for (const exp of expenses) {
    const fy = financialYearLabel(exp.date);
    const entry = byYear.get(fy) ?? { revenue: 0, expenses: 0 };
    entry.expenses += Number(exp.amount);
    byYear.set(fy, entry);
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, v]) => ({ year, ...v, profit: v.revenue - v.expenses }));
}
