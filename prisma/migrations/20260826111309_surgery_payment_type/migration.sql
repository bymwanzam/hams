-- CreateEnum
CREATE TYPE "SurgeryPaymentType" AS ENUM ('CASH', 'INSURANCE');

-- AlterTable
ALTER TABLE "Surgery" ADD COLUMN     "paymentType" "SurgeryPaymentType" NOT NULL DEFAULT 'CASH';
