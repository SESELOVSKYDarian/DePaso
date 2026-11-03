-- AlterTable: anuncios con emoji, imagen, ventana emergente y notificación al celular
ALTER TABLE `announcements`
    ADD COLUMN `emoji` VARCHAR(16) NULL,
    ADD COLUMN `imageData` MEDIUMTEXT NULL,
    ADD COLUMN `thumbData` TEXT NULL,
    ADD COLUMN `showPopup` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pushedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `push_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `platform` VARCHAR(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `push_tokens_token_key`(`token`),
    INDEX `push_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notification_settings` (
    `userId` VARCHAR(191) NOT NULL,
    `news` BOOLEAN NOT NULL DEFAULT true,
    `offers` BOOLEAN NOT NULL DEFAULT true,
    `lists` BOOLEAN NOT NULL DEFAULT true,
    `routes` BOOLEAN NOT NULL DEFAULT true,
    `offersLastPushAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `push_tokens` ADD CONSTRAINT `push_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notification_settings` ADD CONSTRAINT `user_notification_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
