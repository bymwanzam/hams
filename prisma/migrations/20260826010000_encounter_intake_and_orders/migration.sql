-- AlterTable
ALTER TABLE "Encounter" ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "historyOfPresentingComplaint" TEXT,
ADD COLUMN     "pastMedicalHistory" TEXT,
ADD COLUMN     "pastSurgicalHistory" TEXT,
ADD COLUMN     "drugHistory" TEXT,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "familyHistory" TEXT,
ADD COLUMN     "socialHistory" TEXT,
ADD COLUMN     "reviewOfSystems" TEXT,
ADD COLUMN     "examinationFindings" TEXT,
ADD COLUMN     "managementPlan" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Encounter_appointmentId_key" ON "Encounter"("appointmentId");

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "LabOrder" ADD COLUMN     "encounterId" TEXT;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ImagingOrder" ADD COLUMN     "encounterId" TEXT;

-- AddForeignKey
ALTER TABLE "ImagingOrder" ADD CONSTRAINT "ImagingOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
