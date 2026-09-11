-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('HOME', 'WORK', 'STUDY', 'GYM', 'FAMILY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProductPreferenceType" AS ENUM ('EXACT', 'PREFERRED', 'ANY');

-- CreateEnum
CREATE TYPE "StorePreferenceType" AS ENUM ('REQUIRED', 'PREFERRED');

-- CreateEnum
CREATE TYPE "PriceSourceType" AS ENUM ('OFFICIAL', 'STORE', 'COMMUNITY', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "PriceStatus" AS ENUM ('VERIFIED', 'COMMUNITY_CONFIRMED', 'DISPUTED', 'IN_REVIEW', 'STALE', 'LOW_CONFIDENCE');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "OptimizationMode" AS ENUM ('BALANCED', 'CHEAPEST', 'FASTEST');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('CAR', 'MOTORCYCLE', 'BICYCLE', 'WALK', 'PUBLIC_TRANSPORT');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS', 'PRIVACY', 'LOCATION', 'MARKETING');

-- CreateEnum
CREATE TYPE "ModerationEventType" AS ENUM ('REPORT_HIDDEN', 'REPORT_WEIGHTED_DOWN', 'REPORT_REJECTED', 'USER_SUSPENDED', 'USER_APPEALED', 'PRICE_SENT_TO_REVIEW');

-- CreateEnum
CREATE TYPE "PlanLabel" AS ENUM ('BALANCED', 'FASTEST', 'CHEAPEST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "userId" TEXT NOT NULL,
    "ageConfirmed18Plus" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_places" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlaceType" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_route_contexts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "waypointPlaceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_route_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ean" TEXT,
    "unit" TEXT NOT NULL,
    "unitSize" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_aliases" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "product_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_branches" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Mar del Plata',

    CONSTRAINT "store_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "storeBranchId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "sourceType" "PriceSourceType" NOT NULL,
    "sourceReference" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" "ConfidenceLevel" NOT NULL,
    "status" "PriceStatus" NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "storeBranchId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PriceStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "storeBranchId" TEXT NOT NULL,
    "reportedPrice" DECIMAL(12,2) NOT NULL,
    "requiresPromotion" BOOLEAN NOT NULL DEFAULT false,
    "promotionNote" TEXT,
    "photoEvidenceUrl" TEXT,
    "goodFaithDeclared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_trust_scores" (
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "reportsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "reportsConfirmed" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_trust_scores_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "community_moderation_events" (
    "id" TEXT NOT NULL,
    "type" "ModerationEventType" NOT NULL,
    "targetPriceReportId" TEXT,
    "targetUserId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminId" TEXT,

    CONSTRAINT "community_moderation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "ProductPreferenceType" NOT NULL,
    "preferredBrandId" TEXT,

    CONSTRAINT "product_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "StorePreferenceType" NOT NULL,
    "storeBranchId" TEXT NOT NULL,

    CONSTRAINT "store_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "mode" "OptimizationMode" NOT NULL,
    "transportMode" "TransportMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimization_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_plans" (
    "id" TEXT NOT NULL,
    "optimizationRunId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "label" "PlanLabel" NOT NULL,
    "totalProductCost" DECIMAL(12,2) NOT NULL,
    "estimatedTravelCost" DECIMAL(12,2) NOT NULL,
    "estimatedEffectiveCost" DECIMAL(12,2) NOT NULL,
    "additionalDistanceMeters" INTEGER NOT NULL,
    "additionalTimeSeconds" INTEGER NOT NULL,
    "numberOfStops" INTEGER NOT NULL,
    "missingProductIds" TEXT[],
    "priceConfidence" "ConfidenceLevel" NOT NULL,
    "estimatedSavings" DECIMAL(12,2) NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "optimization_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_plan_stops" (
    "id" TEXT NOT NULL,
    "optimizationPlanId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "storeBranchId" TEXT NOT NULL,

    CONSTRAINT "optimization_plan_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_plan_items" (
    "id" TEXT NOT NULL,
    "optimizationPlanStopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "optimization_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_consents_userId_type_idx" ON "user_consents"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "user_places_userId_idx" ON "user_places"("userId");

-- CreateIndex
CREATE INDEX "saved_route_contexts_userId_idx" ON "saved_route_contexts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_ean_key" ON "product_variants"("ean");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_aliases_alias_idx" ON "product_aliases"("alias");

-- CreateIndex
CREATE INDEX "store_branches_storeId_idx" ON "store_branches"("storeId");

-- CreateIndex
CREATE INDEX "prices_productVariantId_storeBranchId_idx" ON "prices"("productVariantId", "storeBranchId");

-- CreateIndex
CREATE INDEX "price_history_priceId_idx" ON "price_history"("priceId");

-- CreateIndex
CREATE INDEX "price_reports_productVariantId_storeBranchId_createdAt_idx" ON "price_reports"("productVariantId", "storeBranchId", "createdAt");

-- CreateIndex
CREATE INDEX "community_moderation_events_targetPriceReportId_idx" ON "community_moderation_events"("targetPriceReportId");

-- CreateIndex
CREATE INDEX "shopping_lists_userId_idx" ON "shopping_lists"("userId");

-- CreateIndex
CREATE INDEX "shopping_list_items_shoppingListId_idx" ON "shopping_list_items"("shoppingListId");

-- CreateIndex
CREATE UNIQUE INDEX "product_preferences_userId_productId_key" ON "product_preferences"("userId", "productId");

-- CreateIndex
CREATE INDEX "store_preferences_userId_category_idx" ON "store_preferences"("userId", "category");

-- CreateIndex
CREATE INDEX "optimization_runs_userId_idx" ON "optimization_runs"("userId");

-- CreateIndex
CREATE INDEX "optimization_plans_optimizationRunId_idx" ON "optimization_plans"("optimizationRunId");

-- CreateIndex
CREATE INDEX "optimization_plan_stops_optimizationPlanId_idx" ON "optimization_plan_stops"("optimizationPlanId");

-- CreateIndex
CREATE INDEX "optimization_plan_items_optimizationPlanStopId_idx" ON "optimization_plan_items"("optimizationPlanStopId");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_places" ADD CONSTRAINT "user_places_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_route_contexts" ADD CONSTRAINT "saved_route_contexts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_aliases" ADD CONSTRAINT "product_aliases_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_branches" ADD CONSTRAINT "store_branches_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_storeBranchId_fkey" FOREIGN KEY ("storeBranchId") REFERENCES "store_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "prices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_storeBranchId_fkey" FOREIGN KEY ("storeBranchId") REFERENCES "store_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_trust_scores" ADD CONSTRAINT "user_trust_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_moderation_events" ADD CONSTRAINT "community_moderation_events_targetPriceReportId_fkey" FOREIGN KEY ("targetPriceReportId") REFERENCES "price_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_preferences" ADD CONSTRAINT "product_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_preferences" ADD CONSTRAINT "product_preferences_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_preferences" ADD CONSTRAINT "store_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_preferences" ADD CONSTRAINT "store_preferences_storeBranchId_fkey" FOREIGN KEY ("storeBranchId") REFERENCES "store_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_plans" ADD CONSTRAINT "optimization_plans_optimizationRunId_fkey" FOREIGN KEY ("optimizationRunId") REFERENCES "optimization_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_plan_stops" ADD CONSTRAINT "optimization_plan_stops_optimizationPlanId_fkey" FOREIGN KEY ("optimizationPlanId") REFERENCES "optimization_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_plan_stops" ADD CONSTRAINT "optimization_plan_stops_storeBranchId_fkey" FOREIGN KEY ("storeBranchId") REFERENCES "store_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_plan_items" ADD CONSTRAINT "optimization_plan_items_optimizationPlanStopId_fkey" FOREIGN KEY ("optimizationPlanStopId") REFERENCES "optimization_plan_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
