-- CreateTable
CREATE TABLE `brand_logos` (
    `slug` VARCHAR(40) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `mimeType` VARCHAR(40) NOT NULL,
    `image` MEDIUMBLOB NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand_logo_aliases` (
    `brandSlug` VARCHAR(40) NOT NULL,
    `alias` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`brandSlug`, `alias`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `brand_logo_aliases` ADD CONSTRAINT `brand_logo_aliases_brandSlug_fkey` FOREIGN KEY (`brandSlug`) REFERENCES `brand_logos`(`slug`) ON DELETE CASCADE ON UPDATE CASCADE;

