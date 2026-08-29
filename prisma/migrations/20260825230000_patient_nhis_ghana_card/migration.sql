-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "nhisNumber" TEXT,
ADD COLUMN     "ghanaCardNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_nhisNumber_key" ON "Patient"("nhisNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_ghanaCardNumber_key" ON "Patient"("ghanaCardNumber");
