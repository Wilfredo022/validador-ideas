-- AlterEnum
ALTER TYPE "AgentName" ADD VALUE 'INVESTIGADOR';

-- CreateTable
CREATE TABLE "MarketResearch" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "queries" JSONB,
    "status" TEXT NOT NULL DEFAULT 'COMPLETE',
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketResearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketResearch_ideaId_createdAt_idx" ON "MarketResearch"("ideaId", "createdAt");

-- AddForeignKey
ALTER TABLE "MarketResearch" ADD CONSTRAINT "MarketResearch_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;