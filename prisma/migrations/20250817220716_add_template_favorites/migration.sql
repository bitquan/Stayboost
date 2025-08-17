-- CreateTable
CREATE TABLE "TemplateFavorites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateFavorites_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PopupTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TemplateFavorites_shop_idx" ON "TemplateFavorites"("shop");

-- CreateIndex
CREATE INDEX "TemplateFavorites_templateId_idx" ON "TemplateFavorites"("templateId");

-- CreateIndex
CREATE INDEX "TemplateFavorites_createdAt_idx" ON "TemplateFavorites"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFavorites_shop_templateId_key" ON "TemplateFavorites"("shop", "templateId");
