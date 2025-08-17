/*
  Warnings:

  - You are about to drop the column `popupSettingsId` on the `PopupAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `revenueRecovered` on the `PopupAnalytics` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ABTest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "popupSettingsId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "testType" TEXT NOT NULL,
    "trafficAllocation" REAL NOT NULL DEFAULT 50.0,
    "variants" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "statisticalSignificance" REAL NOT NULL DEFAULT 0.0,
    "winnerVariantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ABTest_popupSettingsId_fkey" FOREIGN KEY ("popupSettingsId") REFERENCES "PopupSettings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ABTestResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "abTestId" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "conversionValue" REAL NOT NULL DEFAULT 0.0,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "geographicData" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ABTestResult_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "ABTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ABTestStatistic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "abTestId" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "revenue" REAL NOT NULL DEFAULT 0.0,
    "statisticalSignificance" REAL NOT NULL DEFAULT 0.0,
    "confidenceIntervalLower" REAL NOT NULL DEFAULT 0.0,
    "confidenceIntervalUpper" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ABTestStatistic_abTestId_fkey" FOREIGN KEY ("abTestId") REFERENCES "ABTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PopupSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "popupSettingsId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recurrenceRule" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conflictResolution" TEXT NOT NULL DEFAULT 'first_wins',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PopupSchedule_popupSettingsId_fkey" FOREIGN KEY ("popupSettingsId") REFERENCES "PopupSettings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleActivation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scheduleId" INTEGER NOT NULL,
    "activationTime" DATETIME NOT NULL,
    "deactivationTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activationData" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleActivation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PopupSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PopupFrequencyTracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "userIdentifier" TEXT NOT NULL,
    "popupSettingsId" INTEGER,
    "displayCount" INTEGER NOT NULL DEFAULT 0,
    "lastDisplay" DATETIME,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "lastConversion" DATETIME,
    "dismissalCount" INTEGER NOT NULL DEFAULT 0,
    "lastDismissal" DATETIME,
    "userState" TEXT NOT NULL DEFAULT 'new_visitor',
    "behaviorScore" REAL NOT NULL DEFAULT 0.0,
    "adaptiveFrequency" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PopupFrequencyTracking_popupSettingsId_fkey" FOREIGN KEY ("popupSettingsId") REFERENCES "PopupSettings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FrequencyRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "maxPerHour" INTEGER NOT NULL DEFAULT 0,
    "maxPerDay" INTEGER NOT NULL DEFAULT 0,
    "maxPerWeek" INTEGER NOT NULL DEFAULT 0,
    "maxPerMonth" INTEGER NOT NULL DEFAULT 0,
    "minInterval" INTEGER NOT NULL DEFAULT 300,
    "cooldownPeriod" INTEGER NOT NULL DEFAULT 3600,
    "smartAdaptive" BOOLEAN NOT NULL DEFAULT false,
    "adaptiveAlgorithm" TEXT,
    "targetSegments" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PopupTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "popupSettingsId" INTEGER NOT NULL,
    "languageCode" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'popup',
    "title" TEXT,
    "message" TEXT,
    "buttonText" TEXT,
    "dismissText" TEXT,
    "discountCode" TEXT,
    "placeholderText" TEXT,
    "errorMessages" TEXT,
    "successMessages" TEXT,
    "accessibilityLabels" TEXT,
    "customFields" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completenessScore" REAL NOT NULL DEFAULT 0.0,
    "translationQuality" REAL NOT NULL DEFAULT 0.0,
    "lastValidated" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PopupTranslation_popupSettingsId_fkey" FOREIGN KEY ("popupSettingsId") REFERENCES "PopupSettings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PopupAnalytics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "revenue" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PopupAnalytics" ("conversionRate", "conversions", "createdAt", "date", "id", "impressions", "shop", "updatedAt") SELECT coalesce("conversionRate", 0.0) AS "conversionRate", "conversions", "createdAt", "date", "id", "impressions", "shop", "updatedAt" FROM "PopupAnalytics";
DROP TABLE "PopupAnalytics";
ALTER TABLE "new_PopupAnalytics" RENAME TO "PopupAnalytics";
CREATE UNIQUE INDEX "PopupAnalytics_shop_date_key" ON "PopupAnalytics"("shop", "date");
CREATE TABLE "new_PopupSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Wait! Don''t leave yet!',
    "message" TEXT NOT NULL DEFAULT 'Get 10% off your first order',
    "discountCode" TEXT NOT NULL DEFAULT 'SAVE10',
    "discountPercentage" INTEGER NOT NULL DEFAULT 10,
    "delaySeconds" INTEGER NOT NULL DEFAULT 2,
    "showOnce" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PopupSettings" ("createdAt", "delaySeconds", "discountCode", "discountPercentage", "enabled", "id", "message", "shop", "showOnce", "title", "updatedAt") SELECT "createdAt", "delaySeconds", coalesce("discountCode", 'SAVE10') AS "discountCode", coalesce("discountPercentage", 10) AS "discountPercentage", "enabled", "id", "message", "shop", "showOnce", "title", "updatedAt" FROM "PopupSettings";
DROP TABLE "PopupSettings";
ALTER TABLE "new_PopupSettings" RENAME TO "PopupSettings";
CREATE UNIQUE INDEX "PopupSettings_shop_key" ON "PopupSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ABTest_shop_name_key" ON "ABTest"("shop", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestStatistic_abTestId_variantId_date_key" ON "ABTestStatistic"("abTestId", "variantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PopupSchedule_shop_name_key" ON "PopupSchedule"("shop", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PopupFrequencyTracking_shop_userIdentifier_popupSettingsId_key" ON "PopupFrequencyTracking"("shop", "userIdentifier", "popupSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "FrequencyRule_shop_name_key" ON "FrequencyRule"("shop", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PopupTranslation_popupSettingsId_languageCode_namespace_key" ON "PopupTranslation"("popupSettingsId", "languageCode", "namespace");
