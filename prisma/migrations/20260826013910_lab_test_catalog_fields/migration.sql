-- AlterTable
ALTER TABLE "LabTest" ADD COLUMN     "category" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sampleType" TEXT;
