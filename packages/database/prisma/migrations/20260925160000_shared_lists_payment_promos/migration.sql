-- CreateTable
CREATE TABLE "shopping_list_members" (
    "id" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopping_list_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "methodSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_promos" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "normalizedRetailer" TEXT NOT NULL,
    "bank" TEXT,
    "methodSlugs" TEXT[],
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "capAmount" DOUBLE PRECISION,
    "daysOfWeek" INTEGER[],
    "validityNote" TEXT,
    "sourceUrl" TEXT,
    "source" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_promos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopping_list_members_userId_idx" ON "shopping_list_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shopping_list_members_shoppingListId_userId_key" ON "shopping_list_members"("shoppingListId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_payment_methods_userId_methodSlug_key" ON "user_payment_methods"("userId", "methodSlug");

-- CreateIndex
CREATE UNIQUE INDEX "payment_promos_externalId_key" ON "payment_promos"("externalId");

-- CreateIndex
CREATE INDEX "payment_promos_normalizedRetailer_idx" ON "payment_promos"("normalizedRetailer");

-- AddForeignKey
ALTER TABLE "shopping_list_members" ADD CONSTRAINT "shopping_list_members_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_members" ADD CONSTRAINT "shopping_list_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_payment_methods" ADD CONSTRAINT "user_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
