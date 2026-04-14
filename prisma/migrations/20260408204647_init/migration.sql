-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "etymology" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "firstRecorded" INTEGER,
    "lastRecorded" INTEGER,
    "frequency" DOUBLE PRECISION,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedByAI" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DOUBLE PRECISION,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtymologyEdge" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "yearOfTransition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EtymologyEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDiscovery" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "viewportState" JSONB,

    CONSTRAINT "UserDiscovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedAIResponse" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CachedAIResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Word_word_idx" ON "Word"("word");

-- CreateIndex
CREATE INDEX "Word_language_idx" ON "Word"("language");

-- CreateIndex
CREATE INDEX "Word_era_idx" ON "Word"("era");

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_language_key" ON "Word"("word", "language");

-- CreateIndex
CREATE INDEX "EtymologyEdge_sourceId_idx" ON "EtymologyEdge"("sourceId");

-- CreateIndex
CREATE INDEX "EtymologyEdge_targetId_idx" ON "EtymologyEdge"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "EtymologyEdge_sourceId_targetId_relationshipType_key" ON "EtymologyEdge"("sourceId", "targetId", "relationshipType");

-- CreateIndex
CREATE INDEX "UserDiscovery_sessionId_idx" ON "UserDiscovery"("sessionId");

-- CreateIndex
CREATE INDEX "UserDiscovery_wordId_idx" ON "UserDiscovery"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "CachedAIResponse_queryHash_key" ON "CachedAIResponse"("queryHash");

-- CreateIndex
CREATE INDEX "CachedAIResponse_queryHash_idx" ON "CachedAIResponse"("queryHash");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtymologyEdge" ADD CONSTRAINT "EtymologyEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtymologyEdge" ADD CONSTRAINT "EtymologyEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiscovery" ADD CONSTRAINT "UserDiscovery_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
