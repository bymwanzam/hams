-- AlterEnum
ALTER TYPE "AdmissionStatus" ADD VALUE 'DECEASED';

-- AlterTable
ALTER TABLE "Admission" ADD COLUMN     "causeOfDeath" TEXT,
ADD COLUMN     "isMalariaCase" BOOLEAN NOT NULL DEFAULT false;
