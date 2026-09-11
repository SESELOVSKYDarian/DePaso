# Base de datos

Postgres + Prisma. Schema completo en `packages/database/prisma/schema.prisma`. Este
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
- **`Session`** (agregado en Fase 4, no estaba en la sección 70 del master prompt pero es
  necesaria para "sesión persistente" — sección 10): guarda el hash SHA-256 del token, no
  el token — un dump de la tabla no alcanza para robar sesiones activas. `revokedAt`
  permite revocar sin borrar (logout, eliminar cuenta) manteniendo trazabilidad.
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

## Estado de la base local (actualizado 2026-09-11, Sesión 7)

Postgres corriendo de verdad en esta máquina (PostgreSQL 17 nativo, no Docker — ver
`docs/development/DECISIONS.md` para el porqué y cómo se resolvió un hallazgo de una
instalación previa del usuario). `prisma migrate dev` corrió (`20260911142832_init`) y el
seed corrió con datos reales en la tabla: 14 marcas, 100 productos/variantes, 6 comercios,
23 sucursales, 1388 precios SEED/DEMO. Fase 4/6/7 se probaron de punta a punta contra esta
base — ver `PROGRESS.md`.

En otra máquina o en CI, seguí usando Docker normalmente:

```bash
docker compose up -d
pnpm --filter @depaso/database exec prisma migrate dev
pnpm --filter @depaso/database run seed
```

## Seed de desarrollo

`packages/database/prisma/seed.ts` genera datos DEMO/SEED de forma procedural (no
tipeados a mano): ~6 comercios, ~2-5 sucursales por comercio (~15-25 en total) alrededor
de un centro de Mar del Plata, ~100 productos/variantes con alias, precios aleatorios
(pero determinísticos — PRNG con semilla fija) por sucursal, y un precio marcado
`DISPUTED` de ejemplo. Explícitamente no representa precios reales — sección 85 del master
prompt ("los datos ficticios deben marcarse como seed/demo").

Ya corrió contra la base local de esta máquina (ver arriba). Para volver a correrlo (ej.
después de cambiar el schema, o en otra máquina):

```bash
pnpm --filter @depaso/database exec prisma migrate dev
pnpm --filter @depaso/database run seed
```

## Retención y borrado (cross-ref legal)

El schema no implementa todavía los jobs de retención/borrado automático descritos en
`docs/legal-functional/LEGAL.md` (p.15) — ej. borrar lugares temporales al fin del día,
purgar fotos de evidencia tras resolución de disputa. Eso es trabajo de Fase 19 (Perfil y
privacidad) + un job programado, no del schema en sí. El schema sí deja `deletedAt` en
`User` para soportar borrado lógico antes de una purga definitiva.
