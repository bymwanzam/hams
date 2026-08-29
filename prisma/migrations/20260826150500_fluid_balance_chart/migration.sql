-- CreateTable
CREATE TABLE "FluidBalanceEntry" (
    "id" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "oralIntakeMl" INTEGER,
    "ivIntakeMl" INTEGER,
    "otherIntakeMl" INTEGER,
    "urineOutputMl" INTEGER,
    "otherOutputMl" INTEGER,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FluidBalanceEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FluidBalanceEntry" ADD CONSTRAINT "FluidBalanceEntry_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidBalanceEntry" ADD CONSTRAINT "FluidBalanceEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
