-- AlterTable
ALTER TABLE "Drug" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3);
