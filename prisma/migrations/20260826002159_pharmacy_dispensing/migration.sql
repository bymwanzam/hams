/*
  Warnings:

  - Added the required column `dispensedById` to the `Dispense` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Dispense_prescriptionId_key";

-- AlterTable
ALTER TABLE "Dispense" ADD COLUMN     "dispensedById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Drug" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nhisCovered" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Dispense" ADD CONSTRAINT "Dispense_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
