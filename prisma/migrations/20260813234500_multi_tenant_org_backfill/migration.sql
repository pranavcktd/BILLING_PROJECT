-- Multi-tenant retrofit: introduce Organization as the tenant boundary and
-- backfill all existing single-tenant data into one Organization row so the
-- current advocate's account keeps working unchanged.

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profession" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Seed the single existing organization ("Organization #1") representing
-- the current advocate's practice, so every existing row can be backfilled
-- to point at it.
INSERT INTO "Organization" ("id", "name", "subscriptionStatus", "createdAt", "updatedAt")
VALUES ('crykjv9ic8qagu1njmxbswbxx', 'Pranav Patel (Advocate)', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: add nullable organizationId columns first, backfill below,
-- then tighten to NOT NULL once every row has a value.
ALTER TABLE "BankAccount" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "Client" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "ClientNote" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "Contract" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "Expense" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "Matter" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "Payment" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "Quotation" ADD COLUMN     "organizationId" TEXT;
ALTER TABLE "ServiceItem" ADD COLUMN     "organizationId" TEXT;

-- User.organizationId stays nullable (null for SUPER_ADMIN accounts).
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT;

-- FirmProfile/EmailSettings move off the hardcoded "singleton" PK default
-- to a real per-organization row (id keeps its existing value, e.g. the
-- literal string 'singleton' that already exists in each table today).
ALTER TABLE "FirmProfile" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "EmailSettings" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- Backfill: every existing row belongs to the single seeded organization.
UPDATE "BankAccount" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "Client" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "ClientNote" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "Contract" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "Expense" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "Invoice" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "Matter" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "Payment" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "Quotation" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "ServiceItem" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "FirmProfile" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "EmailSettings" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx';
UPDATE "User" SET "organizationId" = 'crykjv9ic8qagu1njmxbswbxx' WHERE "role" = 'ADVOCATE';

-- Tighten to NOT NULL now that every row has a value (User stays nullable).
ALTER TABLE "BankAccount" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Client" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ClientNote" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Contract" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Matter" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Quotation" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ServiceItem" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "FirmProfile" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "EmailSettings" ALTER COLUMN "organizationId" SET NOT NULL;

-- DropIndex: invoice/quotation numbers move from globally-unique to
-- unique-per-organization, since each org runs its own numbering sequence.
DROP INDEX "Invoice_number_key";
DROP INDEX "Quotation_number_key";

-- CreateIndex
CREATE INDEX "BankAccount_organizationId_idx" ON "BankAccount"("organizationId");
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");
CREATE INDEX "ClientNote_organizationId_idx" ON "ClientNote"("organizationId");
CREATE INDEX "Contract_organizationId_idx" ON "Contract"("organizationId");
CREATE UNIQUE INDEX "EmailSettings_organizationId_key" ON "EmailSettings"("organizationId");
CREATE INDEX "Expense_organizationId_idx" ON "Expense"("organizationId");
CREATE UNIQUE INDEX "FirmProfile_organizationId_key" ON "FirmProfile"("organizationId");
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");
CREATE UNIQUE INDEX "Invoice_number_organizationId_key" ON "Invoice"("number", "organizationId");
CREATE INDEX "Matter_organizationId_idx" ON "Matter"("organizationId");
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");
CREATE INDEX "Quotation_organizationId_idx" ON "Quotation"("organizationId");
CREATE UNIQUE INDEX "Quotation_number_organizationId_key" ON "Quotation"("number", "organizationId");
CREATE INDEX "ServiceItem_organizationId_idx" ON "ServiceItem"("organizationId");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- AddForeignKey
ALTER TABLE "FirmProfile" ADD CONSTRAINT "FirmProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Matter" ADD CONSTRAINT "Matter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailSettings" ADD CONSTRAINT "EmailSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
