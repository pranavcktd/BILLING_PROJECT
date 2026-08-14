-- The previous migration only backfilled organizationId for ADVOCATE-role
-- Users; CLIENT-role Users are denormalized from their linked Client so a
-- session lookup never needs a scoped-table read. Backfill that here.
UPDATE "User" u
SET "organizationId" = c."organizationId"
FROM "Client" c
WHERE u."clientId" = c."id"
  AND u."role" = 'CLIENT';
