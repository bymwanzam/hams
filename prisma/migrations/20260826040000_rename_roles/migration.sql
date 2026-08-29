-- Rename enum values in place (Postgres 10+) so existing rows keep their
-- role rather than needing a data migration.
ALTER TYPE "UserRole" RENAME VALUE 'FRONT_DESK' TO 'HEALTH_OFFICER';
ALTER TYPE "UserRole" RENAME VALUE 'RADIOLOGIST' TO 'IMAGING_OFFICER';
