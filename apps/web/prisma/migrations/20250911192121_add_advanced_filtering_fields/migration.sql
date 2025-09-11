-- CreateTable
CREATE TABLE "public"."Release" (
    "id" SERIAL NOT NULL,
    "ocid" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "title" TEXT,
    "buyerName" TEXT,
    "status" TEXT,
    "procurementMethod" TEXT,
    "mainProcurementCategory" TEXT,
    "valueAmount" DOUBLE PRECISION,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_ocid_key" ON "public"."Release"("ocid");

-- CreateIndex
CREATE INDEX "Release_releaseDate_idx" ON "public"."Release"("releaseDate");

-- CreateIndex
CREATE INDEX "Release_buyerName_idx" ON "public"."Release"("buyerName");

-- CreateIndex
CREATE INDEX "Release_status_idx" ON "public"."Release"("status");

-- CreateIndex
CREATE INDEX "Release_procurementMethod_idx" ON "public"."Release"("procurementMethod");

-- CreateIndex
CREATE INDEX "Release_mainProcurementCategory_idx" ON "public"."Release"("mainProcurementCategory");

-- CreateIndex
CREATE INDEX "Release_valueAmount_idx" ON "public"."Release"("valueAmount");

-- CreateIndex
CREATE INDEX "Release_createdAt_idx" ON "public"."Release"("createdAt");
