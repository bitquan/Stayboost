-- CreateTable
CREATE TABLE "TargetingRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TargetingExecution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetingRuleId" INTEGER NOT NULL,
    "visitorId" TEXT,
    "sessionId" TEXT,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "executionTime" REAL NOT NULL DEFAULT 0.0,
    "conditionsEvaluated" TEXT,
    "resultData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TargetingExecution_targetingRuleId_fkey" FOREIGN KEY ("targetingRuleId") REFERENCES "TargetingRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "segmentType" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "estimatedSize" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCalculated" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_CustomerSegmentToTargetingRule" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CustomerSegmentToTargetingRule_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomerSegment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CustomerSegmentToTargetingRule_B_fkey" FOREIGN KEY ("B") REFERENCES "TargetingRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TargetingRule_shop_idx" ON "TargetingRule"("shop");

-- CreateIndex
CREATE INDEX "TargetingRule_isActive_idx" ON "TargetingRule"("isActive");

-- CreateIndex
CREATE INDEX "TargetingRule_priority_idx" ON "TargetingRule"("priority");

-- CreateIndex
CREATE INDEX "TargetingExecution_targetingRuleId_idx" ON "TargetingExecution"("targetingRuleId");

-- CreateIndex
CREATE INDEX "TargetingExecution_matched_idx" ON "TargetingExecution"("matched");

-- CreateIndex
CREATE INDEX "TargetingExecution_createdAt_idx" ON "TargetingExecution"("createdAt");

-- CreateIndex
CREATE INDEX "CustomerSegment_shop_idx" ON "CustomerSegment"("shop");

-- CreateIndex
CREATE INDEX "CustomerSegment_isActive_idx" ON "CustomerSegment"("isActive");

-- CreateIndex
CREATE INDEX "CustomerSegment_segmentType_idx" ON "CustomerSegment"("segmentType");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomerSegmentToTargetingRule_AB_unique" ON "_CustomerSegmentToTargetingRule"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomerSegmentToTargetingRule_B_index" ON "_CustomerSegmentToTargetingRule"("B");
