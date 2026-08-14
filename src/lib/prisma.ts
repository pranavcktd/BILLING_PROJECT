import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCurrentOrgId } from "@/lib/tenant-context";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prismaBase: PrismaClient | undefined;
};

const prismaBase = globalForPrisma.prismaBase ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBase = prismaBase;
}

// Models that carry an `organizationId` column and must always be scoped to
// the current request's tenant. Everything else (User, Organization, and
// the item/junction tables that are never queried standalone) passes
// through untouched.
const TENANT_SCOPED_MODELS = new Set([
  "Client",
  "Matter",
  "Quotation",
  "Contract",
  "Invoice",
  "Payment",
  "BankAccount",
  "ServiceItem",
  "Expense",
  "ClientNote",
  "FirmProfile",
  "EmailSettings",
]);

// FK fields on tenant-scoped models that reference another tenant-scoped
// model. On every write, each present FK value must be proven to belong to
// the current org before the write is allowed through — otherwise an
// authenticated user in org A could submit a crafted/guessed id belonging
// to org B's Client/Matter/Invoice/etc. and silently link across tenants.
const FK_OWNERSHIP: Record<string, Record<string, string>> = {
  Matter: { clientId: "client" },
  Quotation: { clientId: "client", matterId: "matter" },
  Contract: { clientId: "client", matterId: "matter", quotationId: "quotation" },
  Invoice: { clientId: "client", matterId: "matter", contractId: "contract" },
  Payment: { invoiceId: "invoice", bankAccountId: "bankAccount" },
  ClientNote: { clientId: "client" },
};

async function assertFkOwnership(
  model: string,
  data: Record<string, unknown> | undefined,
  orgId: string
) {
  if (!data) return;
  const fkMap = FK_OWNERSHIP[model];
  if (!fkMap) return;
  for (const [fkField, relatedModel] of Object.entries(fkMap)) {
    const value = data[fkField];
    if (value === undefined || value === null || typeof value !== "string") continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relatedClient = (prismaBase as any)[relatedModel];
    const count = await relatedClient.count({ where: { id: value, organizationId: orgId } });
    if (count === 0) {
      throw new Error(`Invalid ${fkField}: does not belong to your organization.`);
    }
  }
}

const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
  "update",
  "delete",
  "updateManyAndReturn",
]);

export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async $allOperations({ model, operation, args, query }: any) {
        if (!model || !TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        const orgId = await getCurrentOrgId();
        args = args ?? {};

        if (operation === "create") {
          await assertFkOwnership(model, args.data, orgId);
          args.data = { ...(args.data ?? {}), organizationId: orgId };
        } else if (operation === "createMany" || operation === "createManyAndReturn") {
          const items: Record<string, unknown>[] = Array.isArray(args.data) ? args.data : [];
          for (const item of items) {
            await assertFkOwnership(model, item, orgId);
          }
          args.data = items.map((d) => ({ ...d, organizationId: orgId }));
        } else if (operation === "upsert") {
          args.where = { ...(args.where ?? {}), organizationId: orgId };
          await assertFkOwnership(model, args.create, orgId);
          await assertFkOwnership(model, args.update, orgId);
          args.create = { ...(args.create ?? {}), organizationId: orgId };
          args.update = { ...(args.update ?? {}), organizationId: orgId };
        } else if (WHERE_OPS.has(operation)) {
          args.where = { ...(args.where ?? {}), organizationId: orgId };
          if (operation === "update" || operation === "updateMany") {
            await assertFkOwnership(model, args.data, orgId);
          }
        }

        return query(args);
      },
    },
  },
});
