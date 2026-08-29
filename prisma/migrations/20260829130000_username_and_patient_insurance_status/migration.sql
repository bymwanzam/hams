-- Add an optional `username` to User, usable as an alternative to email
-- when signing in.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Patient-level insurance status captured at registration: INSURED
-- (NHIS or private cover) vs CASH (pays out of pocket). Defaults to CASH
-- so existing rows get a sensible value.
CREATE TYPE "PatientInsuranceStatus" AS ENUM ('INSURED', 'CASH');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "insuranceStatus" "PatientInsuranceStatus" NOT NULL DEFAULT 'CASH';
