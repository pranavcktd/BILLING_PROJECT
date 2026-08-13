-- AlterTable
ALTER TABLE "FirmProfile" ADD COLUMN     "signatureImage" TEXT;

-- CreateTable
CREATE TABLE "InvoiceBankAccount" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InvoiceBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceBankAccount_invoiceId_idx" ON "InvoiceBankAccount"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceBankAccount_bankAccountId_idx" ON "InvoiceBankAccount"("bankAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceBankAccount_invoiceId_bankAccountId_key" ON "InvoiceBankAccount"("invoiceId", "bankAccountId");

-- AddForeignKey
ALTER TABLE "InvoiceBankAccount" ADD CONSTRAINT "InvoiceBankAccount_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceBankAccount" ADD CONSTRAINT "InvoiceBankAccount_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: preserve existing single bank-account links before dropping the column
INSERT INTO "InvoiceBankAccount" ("id", "invoiceId", "bankAccountId", "isPrimary")
SELECT gen_random_uuid()::text, "id", "bankAccountId", true
FROM "Invoice"
WHERE "bankAccountId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_bankAccountId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "bankAccountId";
