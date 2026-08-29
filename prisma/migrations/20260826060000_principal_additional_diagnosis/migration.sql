-- Rename in place so existing diagnosis notes aren't lost.
ALTER TABLE "Encounter" RENAME COLUMN "diagnosis" TO "principalDiagnosis";

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN     "additionalDiagnosis" TEXT;
