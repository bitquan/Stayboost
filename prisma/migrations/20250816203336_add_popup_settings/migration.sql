-- CreateTable
CREATE TABLE "PopupSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Wait! Don''t leave yet!',
    "message" TEXT NOT NULL DEFAULT 'Get 10% off your first order',
    "discountCode" TEXT DEFAULT 'SAVE10',
    "discountPercentage" INTEGER DEFAULT 10,
    "delaySeconds" INTEGER NOT NULL DEFAULT 2,
    "showOnce" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PopupSettings_shop_key" ON "PopupSettings"("shop");
