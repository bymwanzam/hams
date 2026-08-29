-- AlterEnum
ALTER TYPE "EncounterType" ADD VALUE 'WARD_ROUND';

-- AlterTable
ALTER TABLE "Admission" ADD COLUMN     "referralReason" TEXT,
ADD COLUMN     "referredTo" TEXT;

-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN     "admissionId" TEXT;

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
