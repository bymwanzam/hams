-- Split the single NURSE role into OPD_NURSE (vital signs only) and
-- WARD_NURSE (vitals, nurse notes, fluid balance chart). Existing NURSE
-- accounts become WARD_NURSE — the superset of the two — so nobody loses
-- access as a result of this migration; reassign specific staff to
-- OPD_NURSE afterwards from Users & Roles if needed.
ALTER TYPE "UserRole" RENAME VALUE 'NURSE' TO 'WARD_NURSE';
ALTER TYPE "UserRole" ADD VALUE 'OPD_NURSE';
