# Base de datos

MySQL 8 + Prisma. Schema completo en `packages/database/prisma/schema.prisma`. Este
documento explica decisiones que el schema no explica por sí solo.

## Por qué estas entidades

La lista de entidades sigue la sección 70 del master prompt casi literal, mapeada a
modelos Prisma. Algunas decisiones de modelado:

- **`Price` vs `PriceHistory`:** `Price` es el precio vigente por
  `(productVariantId, storeBranchId)`; cada cambio crea una fila en `PriceHistory` —
  "nunca sobreescribir sin histórico" es una regla obligatoria
  (`docs/legal-functional/BUSINESS-RULES.md`, p.7).
- **`Product` / `ProductVariant` / `ProductAlias`:** separados porque un producto
  ("Coca-Cola") tiene variantes por presentación (2.25L, 1.5L) y la búsqueda necesita
  tolerar alias ("coca", "coca cola") sin ensuciar el nombre canónico (sección 37-38).
- **`Store` / `StoreBranch`:** un precio pertenece a producto + **sucursal**, nunca sólo a
  la cadena (sección 41) — por eso `Price.storeBranchId`, no `storeId`.
- **`Session`:** es la tabla de *refresh tokens*. Guarda el hash SHA-256 del refresh token, no el
  token: un dump de la tabla no alcanza para robar sesiones activas. El access token es un JWT
  que lleva el `id` de esta fila (`sid`), así que `revokedAt` permite revocar sin borrar
  (logout, eliminar cuenta) manteniendo trazabilidad. Cada canje de refresh revoca la fila
  vieja y crea una nueva (rotación).
- **`UserTrustScore`:** el valor exacto nunca se expone públicamente al usuario
  (BUSINESS-RULES.md p.7) — es un campo interno, no hay endpoint que lo devuelva tal cual
  en este pase (no hay endpoints de trust score todavía, Fase 14).
- **`SavedRouteContext.waypointPlaceIds`:** array de IDs en vez de tabla puente — el orden
  importa (es la secuencia del recorrido) y la cardinalidad es chica (un contexto de un
  día tiene pocos waypoints). Se revisita si hace falta metadata por waypoint más adelante.
- **`StoreBranch.city`:** campo simple con default `"Mar del Plata"`, no una jerarquía
  geográfica completa — el alcance de lanzamiento es sólo Mar del Plata (sección 42); no
  tiene sentido modelar provincia/país/región todavía, pero tampoco se hardcodeó nada que
  impida agregarlo después (es un string, no un enum cerrado).

## Normalización (3FN)

La base cumple **tercera forma normal**:

- **1FN**: no hay listas ni JSON dentro de una celda; cada valor repetido vive en su propia tabla.
- **2FN**: las tablas con clave compuesta (`payment_promo_methods`, `store_branch_hours`…) solo tienen
  columnas que dependen de la clave completa.
- **3FN**: ninguna columna depende de otra columna que no sea la clave.

Tablas que salieron de columnas con listas o con datos repetidos:

| Antes | Ahora |
|---|---|
| `payment_promos.methodSlugs` (lista) | tabla `payment_promo_methods (promoId, methodSlug)` |
| `payment_promos.daysOfWeek` (lista) | tabla `payment_promo_days (promoId, dayOfWeek)` |
| `market_regions.localityAliases` (lista) | tabla `market_region_localities (regionId, alias)` |
| `saved_route_contexts.waypointPlaceIds` + `stops` (JSON) | tabla `saved_route_stops (contextId, position, …)` |
| `store_branches.openingHours` (JSON) | tabla `store_branch_hours (branchId, day, hours)` |
| `optimization_plans.missingProductIds` (lista) | tabla `optimization_plan_missing_products` |
| `brand_logos.aliases` (lista de nombres de la cadena) | tabla `brand_logo_aliases (brandSlug, alias)` |
| `store_branches.city` y `province` (dependían de la región) | se leen de `market_regions` vía `marketRegionId` |
| `price_history.productVariantId` y `storeBranchId` (dependían de `priceId`) | se leen de `prices` |
| `optimization_plan_items.productId` (dependía de la variante) | se lee de `product_variants` |

Decisiones que se mantienen a propósito:

- `normalizedName` / `normalizedAlias` / `normalizedRetailer`: texto normalizado (sin tildes ni
  mayúsculas) guardado para buscar rápido con índice. Es una columna de búsqueda, no un dato nuevo.
- Los totales de `optimization_plans` (`totalProductCost`, `estimatedEffectiveCost`, ahorro) son el
  **resultado congelado** del optimizador ese día; no se pueden recalcular después porque los
  precios y promociones cambian.
- `user_trust_scores.reportsSubmitted/reportsConfirmed` son contadores cacheados para no contar
  `price_reports` en cada consulta.

## Motor y migraciones

MySQL 8 (collation `utf8mb4_unicode_ci`: las búsquedas ignoran mayúsculas y acentos). La
migración inicial es `prisma/migrations/20261027000000_init` (35 tablas de dominio + 6 de normalización). Notas del paso desde Postgres:

- El SQL crudo (búsqueda, facetas, popularidad, feed de Inicio) usa `ROW_NUMBER()` en lugar de
  `DISTINCT ON` y `CONCAT()` en lugar de `||`. Los `COUNT` vuelven como `BigInt` y se convierten.

Local:

```bash
docker compose up -d                                  # MySQL 8 en localhost:3306
pnpm --filter @depaso/database run migrate:deploy     # aplica las migraciones
pnpm --filter @depaso/database run seed
```

En EasyPanel el contenedor de la API aplica las migraciones al arrancar.

## Seed de desarrollo

`packages/database/prisma/seed.ts` genera datos DEMO/SEED de forma procedural (no
tipeados a mano): ~6 comercios, ~2-5 sucursales por comercio (~15-25 en total) alrededor
de un centro de Mar del Plata, ~100 productos/variantes con alias, precios aleatorios
(pero determinísticos — PRNG con semilla fija) por sucursal, y un precio marcado
`DISPUTED` de ejemplo. Explícitamente no representa precios reales — sección 85 del master
prompt ("los datos ficticios deben marcarse como seed/demo").

Para volver a correrlo (por ejemplo después de cambiar el schema):

```bash
pnpm --filter @depaso/database run migrate:deploy
pnpm --filter @depaso/database run seed
```

## Retención y borrado (cross-ref legal)

El schema no implementa todavía los jobs de retención/borrado automático descritos en
`docs/legal-functional/LEGAL.md` (p.15) — ej. borrar lugares temporales al fin del día,
purgar fotos de evidencia tras resolución de disputa. Eso es trabajo de Fase 19 (Perfil y
privacidad) + un job programado, no del schema en sí. El schema sí deja `deletedAt` en
`User` para soportar borrado lógico antes de una purga definitiva.
