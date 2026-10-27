-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `role` ENUM('USER', 'MERCHANT', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_requests` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `businessName` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `contactVerifiedAt` DATETIME(3) NULL,
    `contactVerifiedBy` VARCHAR(191) NULL,
    `storeBranchId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `merchant_requests_userId_idx`(`userId`),
    INDEX `merchant_requests_status_idx`(`status`),
    INDEX `merchant_requests_storeBranchId_idx`(`storeBranchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `userId` VARCHAR(191) NOT NULL,
    `ageConfirmed18Plus` BOOLEAN NOT NULL DEFAULT false,
    `marketingOptIn` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_consents` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('TERMS', 'PRIVACY', 'LOCATION', 'MARKETING') NOT NULL,
    `documentVersion` VARCHAR(191) NOT NULL,
    `accepted` BOOLEAN NOT NULL,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_consents_userId_type_idx`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `sessions_tokenHash_key`(`tokenHash`),
    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_places` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('HOME', 'WORK', 'STUDY', 'GYM', 'FAMILY', 'CUSTOM') NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_places_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_route_contexts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saved_route_contexts_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_route_stops` (
    `contextId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `emoji` VARCHAR(16) NOT NULL,
    `placeId` VARCHAR(191) NULL,

    INDEX `saved_route_stops_placeId_idx`(`placeId`),
    PRIMARY KEY (`contextId`, `position`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brands` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `brands_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NULL,
    `name` VARCHAR(255) NOT NULL,
    `normalizedName` VARCHAR(255) NULL,
    `category` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NULL,
    `imageCheckedAt` DATETIME(3) NULL,
    `productType` VARCHAR(191) NULL,
    `popularity` INTEGER NOT NULL DEFAULT 0,

    INDEX `products_category_idx`(`category`),
    INDEX `products_normalizedName_idx`(`normalizedName`),
    INDEX `products_productType_idx`(`productType`),
    INDEX `products_productType_popularity_idx`(`productType`, `popularity` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `ean` VARCHAR(191) NULL,
    `eanConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `unit` VARCHAR(191) NOT NULL,
    `unitSize` DOUBLE NOT NULL,

    UNIQUE INDEX `product_variants_ean_key`(`ean`),
    INDEX `product_variants_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_aliases` (
    `id` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NOT NULL,
    `alias` VARCHAR(255) NOT NULL,

    INDEX `product_aliases_alias_idx`(`alias`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_companies` (
    `id` VARCHAR(191) NOT NULL,
    `cuit` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(255) NOT NULL,
    `source` ENUM('SEPA_MINORISTA', 'SEPA_MAYORISTA') NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `store_companies_cuit_key`(`cuit`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stores` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `companyId` VARCHAR(191) NULL,
    `externalSepaBrandId` VARCHAR(191) NULL,
    `normalizedName` VARCHAR(255) NULL,

    UNIQUE INDEX `stores_companyId_externalSepaBrandId_key`(`companyId`, `externalSepaBrandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_aliases` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `alias` VARCHAR(255) NOT NULL,
    `normalizedAlias` VARCHAR(255) NOT NULL,

    INDEX `store_aliases_normalizedAlias_idx`(`normalizedAlias`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_branches` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `externalSepaCommerceId` VARCHAR(191) NULL,
    `externalSepaBrandId` VARCHAR(191) NULL,
    `externalSepaBranchId` VARCHAR(191) NULL,
    `street` VARCHAR(191) NULL,
    `streetNumber` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `source` ENUM('SEPA_MINORISTA', 'SEPA_MAYORISTA') NULL,
    `sourceUpdatedAt` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'POSSIBLY_INACTIVE', 'INACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `marketRegionId` VARCHAR(191) NULL,
    `ownerUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `store_branches_storeId_idx`(`storeId`),
    INDEX `store_branches_marketRegionId_idx`(`marketRegionId`),
    INDEX `store_branches_ownerUserId_idx`(`ownerUserId`),
    UNIQUE INDEX `store_branches_externalSepaCommerceId_externalSepaBrandId_ex_key`(`externalSepaCommerceId`, `externalSepaBrandId`, `externalSepaBranchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_branch_hours` (
    `branchId` VARCHAR(191) NOT NULL,
    `day` VARCHAR(16) NOT NULL,
    `hours` VARCHAR(64) NOT NULL,

    PRIMARY KEY (`branchId`, `day`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branch_data_issues` (
    `id` VARCHAR(191) NOT NULL,
    `storeBranchId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `detail` TEXT NOT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `branch_data_issues_storeBranchId_idx`(`storeBranchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `market_regions` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `province` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'Argentina',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `minLatitude` DOUBLE NOT NULL,
    `maxLatitude` DOUBLE NOT NULL,
    `minLongitude` DOUBLE NOT NULL,
    `maxLongitude` DOUBLE NOT NULL,

    UNIQUE INDEX `market_regions_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `market_region_localities` (
    `regionId` VARCHAR(191) NOT NULL,
    `alias` VARCHAR(120) NOT NULL,

    PRIMARY KEY (`regionId`, `alias`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prices` (
    `id` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NOT NULL,
    `storeBranchId` VARCHAR(191) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `promoPrice1` DECIMAL(12, 2) NULL,
    `promoDescription1` TEXT NULL,
    `promoPrice2` DECIMAL(12, 2) NULL,
    `promoDescription2` TEXT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ARS',
    `sourceType` ENUM('OFFICIAL', 'STORE', 'COMMUNITY', 'ESTIMATED', 'OFFICIAL_SEPA', 'RETAILER_ONLINE', 'RECEIPT', 'MANUAL_ADMIN', 'MERCHANT') NOT NULL,
    `sourceReference` VARCHAR(191) NULL,
    `sourceExternalId` VARCHAR(191) NULL,
    `displayName` VARCHAR(255) NULL,
    `reportedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confidence` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL,
    `status` ENUM('VERIFIED', 'COMMUNITY_CONFIRMED', 'DISPUTED', 'IN_REVIEW', 'STALE', 'LOW_CONFIDENCE') NOT NULL DEFAULT 'VERIFIED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prices_productVariantId_storeBranchId_idx`(`productVariantId`, `storeBranchId`),
    INDEX `prices_sourceExternalId_idx`(`sourceExternalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_history` (
    `id` VARCHAR(191) NOT NULL,
    `priceId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('VERIFIED', 'COMMUNITY_CONFIRMED', 'DISPUTED', 'IN_REVIEW', 'STALE', 'LOW_CONFIDENCE') NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `changeReason` VARCHAR(255) NOT NULL,

    INDEX `price_history_priceId_idx`(`priceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_reports` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NOT NULL,
    `storeBranchId` VARCHAR(191) NOT NULL,
    `reportedPrice` DECIMAL(12, 2) NOT NULL,
    `requiresPromotion` BOOLEAN NOT NULL DEFAULT false,
    `promotionNote` TEXT NULL,
    `photoEvidenceUrl` TEXT NULL,
    `goodFaithDeclared` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `price_reports_productVariantId_storeBranchId_createdAt_idx`(`productVariantId`, `storeBranchId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_trust_scores` (
    `userId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL DEFAULT 0.5,
    `reportsSubmitted` INTEGER NOT NULL DEFAULT 0,
    `reportsConfirmed` INTEGER NOT NULL DEFAULT 0,
    `lastUpdatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `community_moderation_events` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('REPORT_HIDDEN', 'REPORT_WEIGHTED_DOWN', 'REPORT_REJECTED', 'USER_SUSPENDED', 'USER_APPEALED', 'PRICE_SENT_TO_REVIEW') NOT NULL,
    `targetPriceReportId` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdByAdminId` VARCHAR(191) NULL,

    INDEX `community_moderation_events_targetPriceReportId_idx`(`targetPriceReportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_import_runs` (
    `id` VARCHAR(191) NOT NULL,
    `source` ENUM('SEPA_MINORISTA', 'SEPA_MAYORISTA') NOT NULL,
    `resourceId` VARCHAR(191) NOT NULL,
    `resourceLastModified` DATETIME(3) NOT NULL,
    `fileHash` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `status` ENUM('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL') NOT NULL DEFAULT 'RUNNING',
    `rowsRead` INTEGER NOT NULL DEFAULT 0,
    `rowsAccepted` INTEGER NOT NULL DEFAULT 0,
    `rowsRejected` INTEGER NOT NULL DEFAULT 0,
    `branchesDetected` INTEGER NOT NULL DEFAULT 0,
    `error` TEXT NULL,

    INDEX `data_import_runs_source_resourceId_idx`(`source`, `resourceId`),
    UNIQUE INDEX `data_import_runs_source_fileHash_key`(`source`, `fileHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_anomalies` (
    `id` VARCHAR(191) NOT NULL,
    `importRunId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `rawRow` TEXT NOT NULL,
    `reason` TEXT NOT NULL,
    `needsReview` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `import_anomalies_importRunId_idx`(`importRunId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopping_lists` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `shopping_lists_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopping_list_members` (
    `id` VARCHAR(191) NOT NULL,
    `shoppingListId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `shopping_list_members_userId_idx`(`userId`),
    UNIQUE INDEX `shopping_list_members_shoppingListId_userId_key`(`shoppingListId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_payment_methods` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `methodSlug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_payment_methods_userId_methodSlug_key`(`userId`, `methodSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_promos` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `retailer` VARCHAR(255) NOT NULL,
    `normalizedRetailer` VARCHAR(255) NOT NULL,
    `bank` VARCHAR(191) NULL,
    `discountPercent` DOUBLE NOT NULL,
    `capAmount` DOUBLE NULL,
    `validityNote` TEXT NULL,
    `sourceUrl` TEXT NULL,
    `source` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payment_promos_externalId_key`(`externalId`),
    INDEX `payment_promos_normalizedRetailer_idx`(`normalizedRetailer`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_promo_methods` (
    `promoId` VARCHAR(191) NOT NULL,
    `methodSlug` VARCHAR(64) NOT NULL,

    PRIMARY KEY (`promoId`, `methodSlug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_promo_days` (
    `promoId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,

    PRIMARY KEY (`promoId`, `dayOfWeek`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopping_list_items` (
    `id` VARCHAR(191) NOT NULL,
    `shoppingListId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `note` TEXT NULL,

    INDEX `shopping_list_items_shoppingListId_idx`(`shoppingListId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `type` ENUM('EXACT', 'PREFERRED', 'ANY') NOT NULL,
    `preferredBrandId` VARCHAR(191) NULL,

    UNIQUE INDEX `product_preferences_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `type` ENUM('REQUIRED', 'PREFERRED') NOT NULL,
    `storeBranchId` VARCHAR(191) NOT NULL,

    INDEX `store_preferences_userId_category_idx`(`userId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `optimization_runs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `shoppingListId` VARCHAR(191) NOT NULL,
    `mode` ENUM('BALANCED', 'CHEAPEST', 'FASTEST') NOT NULL,
    `transportMode` ENUM('CAR', 'MOTORCYCLE', 'BICYCLE', 'WALK', 'PUBLIC_TRANSPORT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `optimization_runs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `optimization_plans` (
    `id` VARCHAR(191) NOT NULL,
    `optimizationRunId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `label` ENUM('BALANCED', 'FASTEST', 'CHEAPEST') NOT NULL,
    `totalProductCost` DECIMAL(12, 2) NOT NULL,
    `estimatedTravelCost` DECIMAL(12, 2) NOT NULL,
    `estimatedEffectiveCost` DECIMAL(12, 2) NOT NULL,
    `additionalDistanceMeters` INTEGER NOT NULL,
    `additionalTimeSeconds` INTEGER NOT NULL,
    `numberOfStops` INTEGER NOT NULL,
    `priceConfidence` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL,
    `estimatedSavings` DECIMAL(12, 2) NOT NULL,
    `explanation` TEXT NOT NULL,

    INDEX `optimization_plans_optimizationRunId_idx`(`optimizationRunId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `optimization_plan_stops` (
    `id` VARCHAR(191) NOT NULL,
    `optimizationPlanId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `storeBranchId` VARCHAR(191) NOT NULL,

    INDEX `optimization_plan_stops_optimizationPlanId_idx`(`optimizationPlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `optimization_plan_items` (
    `id` VARCHAR(191) NOT NULL,
    `optimizationPlanStopId` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,

    INDEX `optimization_plan_items_optimizationPlanStopId_idx`(`optimizationPlanStopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `optimization_plan_missing_products` (
    `optimizationPlanId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,

    INDEX `optimization_plan_missing_products_productId_idx`(`productId`),
    PRIMARY KEY (`optimizationPlanId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `merchant_requests` ADD CONSTRAINT `merchant_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_requests` ADD CONSTRAINT `merchant_requests_storeBranchId_fkey` FOREIGN KEY (`storeBranchId`) REFERENCES `store_branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_requests` ADD CONSTRAINT `merchant_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_consents` ADD CONSTRAINT `user_consents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_places` ADD CONSTRAINT `user_places_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_route_contexts` ADD CONSTRAINT `saved_route_contexts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_route_stops` ADD CONSTRAINT `saved_route_stops_contextId_fkey` FOREIGN KEY (`contextId`) REFERENCES `saved_route_contexts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_route_stops` ADD CONSTRAINT `saved_route_stops_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `user_places`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_aliases` ADD CONSTRAINT `product_aliases_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stores` ADD CONSTRAINT `stores_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `store_companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_aliases` ADD CONSTRAINT `store_aliases_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_branches` ADD CONSTRAINT `store_branches_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_branches` ADD CONSTRAINT `store_branches_marketRegionId_fkey` FOREIGN KEY (`marketRegionId`) REFERENCES `market_regions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_branches` ADD CONSTRAINT `store_branches_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_branch_hours` ADD CONSTRAINT `store_branch_hours_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `store_branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branch_data_issues` ADD CONSTRAINT `branch_data_issues_storeBranchId_fkey` FOREIGN KEY (`storeBranchId`) REFERENCES `store_branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `market_region_localities` ADD CONSTRAINT `market_region_localities_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `market_regions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prices` ADD CONSTRAINT `prices_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prices` ADD CONSTRAINT `prices_storeBranchId_fkey` FOREIGN KEY (`storeBranchId`) REFERENCES `store_branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_history` ADD CONSTRAINT `price_history_priceId_fkey` FOREIGN KEY (`priceId`) REFERENCES `prices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_reports` ADD CONSTRAINT `price_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_reports` ADD CONSTRAINT `price_reports_storeBranchId_fkey` FOREIGN KEY (`storeBranchId`) REFERENCES `store_branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_trust_scores` ADD CONSTRAINT `user_trust_scores_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `community_moderation_events` ADD CONSTRAINT `community_moderation_events_targetPriceReportId_fkey` FOREIGN KEY (`targetPriceReportId`) REFERENCES `price_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `import_anomalies` ADD CONSTRAINT `import_anomalies_importRunId_fkey` FOREIGN KEY (`importRunId`) REFERENCES `data_import_runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopping_lists` ADD CONSTRAINT `shopping_lists_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopping_list_members` ADD CONSTRAINT `shopping_list_members_shoppingListId_fkey` FOREIGN KEY (`shoppingListId`) REFERENCES `shopping_lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopping_list_members` ADD CONSTRAINT `shopping_list_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_payment_methods` ADD CONSTRAINT `user_payment_methods_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_promo_methods` ADD CONSTRAINT `payment_promo_methods_promoId_fkey` FOREIGN KEY (`promoId`) REFERENCES `payment_promos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_promo_days` ADD CONSTRAINT `payment_promo_days_promoId_fkey` FOREIGN KEY (`promoId`) REFERENCES `payment_promos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopping_list_items` ADD CONSTRAINT `shopping_list_items_shoppingListId_fkey` FOREIGN KEY (`shoppingListId`) REFERENCES `shopping_lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_preferences` ADD CONSTRAINT `product_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_preferences` ADD CONSTRAINT `product_preferences_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_preferences` ADD CONSTRAINT `store_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_preferences` ADD CONSTRAINT `store_preferences_storeBranchId_fkey` FOREIGN KEY (`storeBranchId`) REFERENCES `store_branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_runs` ADD CONSTRAINT `optimization_runs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_runs` ADD CONSTRAINT `optimization_runs_shoppingListId_fkey` FOREIGN KEY (`shoppingListId`) REFERENCES `shopping_lists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_plans` ADD CONSTRAINT `optimization_plans_optimizationRunId_fkey` FOREIGN KEY (`optimizationRunId`) REFERENCES `optimization_runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_plan_stops` ADD CONSTRAINT `optimization_plan_stops_optimizationPlanId_fkey` FOREIGN KEY (`optimizationPlanId`) REFERENCES `optimization_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_plan_stops` ADD CONSTRAINT `optimization_plan_stops_storeBranchId_fkey` FOREIGN KEY (`storeBranchId`) REFERENCES `store_branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_plan_items` ADD CONSTRAINT `optimization_plan_items_optimizationPlanStopId_fkey` FOREIGN KEY (`optimizationPlanStopId`) REFERENCES `optimization_plan_stops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_plan_missing_products` ADD CONSTRAINT `optimization_plan_missing_products_optimizationPlanId_fkey` FOREIGN KEY (`optimizationPlanId`) REFERENCES `optimization_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `optimization_plan_missing_products` ADD CONSTRAINT `optimization_plan_missing_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

