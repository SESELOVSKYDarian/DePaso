-- Inicio ordena los productos por popularidad: con este índice no recorre toda la tabla
CREATE INDEX `products_popularity_idx` ON `products`(`popularity` DESC);
