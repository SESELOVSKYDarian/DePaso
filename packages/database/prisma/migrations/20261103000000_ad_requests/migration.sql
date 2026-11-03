-- CreateTable
CREATE TABLE `ad_requests` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `storeBranchId` VARCHAR(191) NOT NULL,
    `kind` ENUM('FEATURED_PRODUCT', 'BANNER') NOT NULL,
    `title` VARCHAR(80) NOT NULL,
    `message` VARCHAR(280) NULL,
    `productId` VARCHAR(191) NULL,
    `offeredAmount` DECIMAL(12, 2) NOT NULL,
    `durationDays` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `agreedAmount` DECIMAL(12, 2) NULL,
    `adminNote` VARCHAR(300) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ad_requests_userId_idx`(`userId`),
    INDEX `ad_requests_status_endsAt_idx`(`status`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ad_requests` ADD CONSTRAINT `ad_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_requests` ADD CONSTRAINT `ad_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
