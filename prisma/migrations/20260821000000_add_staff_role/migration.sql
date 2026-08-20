-- AlterEnum
-- Isolated in its own migration, same reason as the earlier SUPER_ADMIN
-- addition: Postgres forbids using a brand-new enum value inside the same
-- transaction that added it.
ALTER TYPE "Role" ADD VALUE 'STAFF';
