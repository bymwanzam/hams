-- CreateEnum
CREATE TYPE "AppointmentServiceType" AS ENUM ('GENERAL_OPD_ADULT', 'GENERAL_OPD_CHILD', 'SPECIALIST');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'ARRIVED';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "arrivedAt" TIMESTAMP(3),
ADD COLUMN     "serviceType" "AppointmentServiceType" NOT NULL DEFAULT 'GENERAL_OPD_ADULT',
ALTER COLUMN "department" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VitalSign" ADD COLUMN     "appointmentId" TEXT;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
