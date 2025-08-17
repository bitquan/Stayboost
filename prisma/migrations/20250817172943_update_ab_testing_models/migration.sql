/*
  Warnings:

  - You are about to drop the column `sessionId` on the `AnalyticsEvent` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `AnalyticsEvent` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `AnalyticsEvent` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AnalyticsEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "popupId" TEXT,
    "visitorId" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AnalyticsEvent" ("createdAt", "eventType", "id", "metadata", "popupId", "shop", "visitorId") SELECT "createdAt", "eventType", "id", "metadata", "popupId", "shop", "visitorId" FROM "AnalyticsEvent";
DROP TABLE "AnalyticsEvent";
ALTER TABLE "new_AnalyticsEvent" RENAME TO "AnalyticsEvent";
CREATE INDEX "AnalyticsEvent_shop_idx" ON "AnalyticsEvent"("shop");
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE INDEX "AnalyticsEvent_visitorId_idx" ON "AnalyticsEvent"("visitorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
