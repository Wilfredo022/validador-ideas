-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('SOFTWARE', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "AgentName" AS ENUM ('VISIONARIO', 'INQUISIDOR', 'CAPITALISTA', 'JUEZ', 'ESTRATEGA', 'ARQUITECTO');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('DESCARTAR', 'REQUIERE_PIVOTE', 'APROBADO');

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "verdict" "Verdict",
    "interviewDone" BOOLEAN NOT NULL DEFAULT false,
    "interviewSkipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefinementMessage" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefinementMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debate" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "context" TEXT,
    "score" INTEGER,
    "verdict" "Verdict",
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentResult" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "agent" "AgentName" NOT NULL,
    "output" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PivotOption" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "chosen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PivotOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentModelConfig" (
    "agent" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "mode" TEXT NOT NULL,

    CONSTRAINT "AgentModelConfig_pkey" PRIMARY KEY ("agent")
);

-- CreateIndex
CREATE INDEX "Idea_score_idx" ON "Idea"("score");

-- CreateIndex
CREATE INDEX "RefinementMessage_ideaId_createdAt_idx" ON "RefinementMessage"("ideaId", "createdAt");

-- CreateIndex
CREATE INDEX "Debate_ideaId_round_idx" ON "Debate"("ideaId", "round");

-- CreateIndex
CREATE INDEX "AgentResult_debateId_agent_idx" ON "AgentResult"("debateId", "agent");

-- AddForeignKey
ALTER TABLE "RefinementMessage" ADD CONSTRAINT "RefinementMessage_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debate" ADD CONSTRAINT "Debate_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentResult" ADD CONSTRAINT "AgentResult_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PivotOption" ADD CONSTRAINT "PivotOption_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
