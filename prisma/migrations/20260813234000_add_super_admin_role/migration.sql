-- AlterEnum
-- Isolated in its own migration: Postgres forbids using a brand-new enum
-- value inside the same transaction that added it, so this must be applied
-- before any migration/data that references SUPER_ADMIN.
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
