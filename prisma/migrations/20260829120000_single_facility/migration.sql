-- Collapse the multi-branch facility model to a single hospital profile.
-- `Facility` loses its branch markers (`code`, `isMain`) and all child
-- relations; the `facilityId` columns are dropped from every other model.

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "Ward" DROP CONSTRAINT "Ward_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "FixedAsset" DROP CONSTRAINT "FixedAsset_facilityId_fkey";

-- DropIndex
DROP INDEX "Facility_code_key";

-- AlterTable
ALTER TABLE "Facility" DROP COLUMN "code",
DROP COLUMN "isMain",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Facility" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "facilityId";

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "facilityId";

-- AlterTable
ALTER TABLE "Ward" DROP COLUMN "facilityId";

-- AlterTable
ALTER TABLE "InventoryItem" DROP COLUMN "facilityId";

-- AlterTable
ALTER TABLE "FixedAsset" DROP COLUMN "facilityId";
