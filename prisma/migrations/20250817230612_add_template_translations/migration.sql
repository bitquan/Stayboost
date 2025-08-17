-- CreateTable
CREATE TABLE "TemplateTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateTranslation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PopupTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TemplateTranslation_templateId_idx" ON "TemplateTranslation"("templateId");

-- CreateIndex
CREATE INDEX "TemplateTranslation_language_idx" ON "TemplateTranslation"("language");

-- CreateIndex
CREATE INDEX "TemplateTranslation_shop_idx" ON "TemplateTranslation"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateTranslation_templateId_language_key_key" ON "TemplateTranslation"("templateId", "language", "key");
