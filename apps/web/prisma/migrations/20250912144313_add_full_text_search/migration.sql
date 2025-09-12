-- CreateTable
CREATE TABLE "IngestionState" (
    "id" TEXT NOT NULL,
    "isBackfillComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastHistoricalPage" INTEGER NOT NULL DEFAULT 0,
    "lastDailySync" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00 +00:00',
    "lastModified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" SERIAL NOT NULL,
    "ocid" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL DEFAULT '',
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "initiationType" TEXT,
    "language" TEXT,
    "tags" TEXT[],

    -- Dropping columns that are no longer needed
    -- "data" JSONB,
    -- "title" TEXT,
    -- "buyerName" TEXT,
    -- "status" TEXT,
    -- "procurementMethod" TEXT,
    -- "mainProcurementCategory" TEXT,
    -- "valueAmount" DOUBLE PRECISION,
    -- "currency" TEXT,
    -- "searchVector" TSVECTOR,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "tenderId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT,
    "description" TEXT,
    "mainProcurementCategory" TEXT,
    "procurementMethod" TEXT,
    "procurementMethodDetails" TEXT,
    "valueJson" JSONB,
    "tenderPeriodJson" JSONB,
    "procuringEntityJson" JSONB,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planning" (
    "id" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "rationale" TEXT,
    "budgetJson" JSONB,

    CONSTRAINT "Planning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "buyerId" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "partyId" TEXT NOT NULL,
    "name" TEXT,
    "roles" TEXT[],
    "detailsJson" JSONB,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "awardId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT,
    "awardDate" TIMESTAMP(3),
    "valueJson" JSONB,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "awardId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "releaseId" INTEGER NOT NULL,
    "contractId" TEXT NOT NULL,
    "awardID" TEXT,
    "title" TEXT,
    "status" TEXT,
    "periodJson" JSONB,
    "valueJson" JSONB,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT,
    "title" TEXT,
    "url" TEXT,
    "format" TEXT,
    "language" TEXT,
    "datePublished" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderItem" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION,
    "unitName" TEXT,

    CONSTRAINT "TenderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenderer" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "tendererId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tenderer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_ocid_key" ON "Release"("ocid");

-- CreateIndex
CREATE UNIQUE INDEX "Tender_releaseId_key" ON "Tender"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Planning_releaseId_key" ON "Planning"("releaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_releaseId_key" ON "Buyer"("releaseId");

-- CreateIndex
CREATE INDEX "Release_releaseDate_idx" ON "Release"("releaseDate");

-- CreateIndex
CREATE INDEX "Tender_title_idx" ON "Tender"("title");

-- CreateIndex
CREATE INDEX "Tender_status_idx" ON "Tender"("status");

-- CreateIndex
CREATE INDEX "Tender_mainProcurementCategory_idx" ON "Tender"("mainProcurementCategory");

-- CreateIndex
CREATE INDEX "Buyer_name_idx" ON "Buyer"("name");

-- CreateIndex
CREATE INDEX "Party_name_idx" ON "Party"("name");

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planning" ADD CONSTRAINT "Planning_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderItem" ADD CONSTRAINT "TenderItem_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenderer" ADD CONSTRAINT "Tenderer_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;