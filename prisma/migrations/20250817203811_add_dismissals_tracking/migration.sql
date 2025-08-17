-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TemplateUsageStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "shop" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "dismissals" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "revenue" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateUsageStats_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PopupTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TemplateUsageStats" ("conversionRate", "conversions", "createdAt", "date", "id", "impressions", "revenue", "shop", "templateId", "updatedAt", "usageCount") SELECT "conversionRate", "conversions", "createdAt", "date", "id", "impressions", "revenue", "shop", "templateId", "updatedAt", "usageCount" FROM "TemplateUsageStats";
DROP TABLE "TemplateUsageStats";
ALTER TABLE "new_TemplateUsageStats" RENAME TO "TemplateUsageStats";
CREATE INDEX "TemplateUsageStats_templateId_idx" ON "TemplateUsageStats"("templateId");
CREATE INDEX "TemplateUsageStats_date_idx" ON "TemplateUsageStats"("date");
CREATE UNIQUE INDEX "TemplateUsageStats_templateId_shop_date_key" ON "TemplateUsageStats"("templateId", "shop", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
