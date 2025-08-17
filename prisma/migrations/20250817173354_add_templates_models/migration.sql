-- CreateTable
CREATE TABLE "PopupTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'custom',
    "config" TEXT NOT NULL,
    "previewImage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL NOT NULL DEFAULT 0.0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "tags" TEXT,
    "lastUsed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemplateUsageStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "shop" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "revenue" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateUsageStats_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PopupTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "shop" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplateRating_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PopupTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PopupTemplate_shop_idx" ON "PopupTemplate"("shop");

-- CreateIndex
CREATE INDEX "PopupTemplate_category_idx" ON "PopupTemplate"("category");

-- CreateIndex
CREATE INDEX "PopupTemplate_isFeatured_idx" ON "PopupTemplate"("isFeatured");

-- CreateIndex
CREATE INDEX "PopupTemplate_usageCount_idx" ON "PopupTemplate"("usageCount");

-- CreateIndex
CREATE INDEX "TemplateUsageStats_templateId_idx" ON "TemplateUsageStats"("templateId");

-- CreateIndex
CREATE INDEX "TemplateUsageStats_date_idx" ON "TemplateUsageStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateUsageStats_templateId_shop_date_key" ON "TemplateUsageStats"("templateId", "shop", "date");

-- CreateIndex
CREATE INDEX "TemplateRating_templateId_idx" ON "TemplateRating"("templateId");

-- CreateIndex
CREATE INDEX "TemplateRating_rating_idx" ON "TemplateRating"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateRating_templateId_shop_key" ON "TemplateRating"("templateId", "shop");
