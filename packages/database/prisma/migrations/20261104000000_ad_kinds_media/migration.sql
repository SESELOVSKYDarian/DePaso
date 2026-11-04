-- Nuevos formatos de publicidad (imagen y video) y los archivos que los acompañan
ALTER TABLE `ad_requests`
    MODIFY `kind` ENUM('FEATURED_PRODUCT', 'BANNER', 'IMAGE', 'VIDEO') NOT NULL,
    ADD COLUMN `imageData` MEDIUMTEXT NULL,
    ADD COLUMN `videoUrl` VARCHAR(500) NULL;
