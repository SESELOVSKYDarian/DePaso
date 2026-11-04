-- Precio base por dia de cada publicidad (lo fija el administrador) y vencimiento de los anuncios
CREATE TABLE `ad_prices` (
    `kind` ENUM('FEATURED_PRODUCT', 'BANNER', 'IMAGE', 'VIDEO') NOT NULL,
    `pricePerDay` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`kind`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `announcements` ADD COLUMN `expiresAt` DATETIME(3) NULL;
