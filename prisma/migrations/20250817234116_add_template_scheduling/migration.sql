/*
  Warnings:

  - You are about to drop the `PopupSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "PopupSchedule_shop_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PopupSchedule";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TemplateSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "campaignType" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "autoActivate" BOOLEAN NOT NULL DEFAULT true,
    "conflictResolution" TEXT NOT NULL DEFAULT 'higher_priority',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PopupTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "templateConfig" TEXT NOT NULL,
    "defaultSchedule" TEXT,
    "targetAudience" TEXT,
    "performanceGoals" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "avgConversionRate" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduleActivation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER NOT NULL,
    "activationTime" DATETIME NOT NULL,
    "deactivationTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activationData" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleActivation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TemplateSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScheduleActivation" ("activationData", "activationTime", "createdAt", "deactivationTime", "errorMessage", "id", "scheduleId", "status") SELECT "activationData", "activationTime", "createdAt", "deactivationTime", "errorMessage", "id", "scheduleId", "status" FROM "ScheduleActivation";
DROP TABLE "ScheduleActivation";
ALTER TABLE "new_ScheduleActivation" RENAME TO "ScheduleActivation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TemplateSchedule_shop_startDate_endDate_idx" ON "TemplateSchedule"("shop", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "TemplateSchedule_campaignType_scheduleType_idx" ON "TemplateSchedule"("campaignType", "scheduleType");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSchedule_shop_name_key" ON "TemplateSchedule"("shop", "name");

-- CreateIndex
CREATE INDEX "CampaignTemplate_campaignType_idx" ON "CampaignTemplate"("campaignType");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignTemplate_shop_name_key" ON "CampaignTemplate"("shop", "name");
