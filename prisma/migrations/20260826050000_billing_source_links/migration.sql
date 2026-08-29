-- AlterTable
ALTER TABLE "InvoiceLineItem" ADD COLUMN     "labOrderId" TEXT,
ADD COLUMN     "dispenseItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceLineItem_labOrderId_key" ON "InvoiceLineItem"("labOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceLineItem_dispenseItemId_key" ON "InvoiceLineItem"("dispenseItemId");

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_dispenseItemId_fkey" FOREIGN KEY ("dispenseItemId") REFERENCES "DispenseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
