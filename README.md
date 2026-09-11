# DePaso

**Ahorrá en el camino.**

Asistente de conveniencia cotidiana que calcula qué compra conviene según el recorrido
real de la persona — no un comparador de precios clásico. Lanzamiento inicial: sólo Mar
del Plata, Buenos Aires, Argentina.

> "DePaso" es working name sujeto a clearance marcario (riesgo ALTO). Ver
> [docs/brand-product/DECISIONS.md](docs/brand-product/DECISIONS.md).

## Documentación — fuente de verdad

Antes de tocar código, leer:

- [docs/README.md](docs/README.md) — índice de toda la documentación de producto/marca/legal.
- [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md) — arquitectura técnica.
- [docs/development/IMPLEMENTATION-PLAN.md](docs/development/IMPLEMENTATION-PLAN.md) — plan de fases.
- [docs/development/PROGRESS.md](docs/development/PROGRESS.md) — estado actual, qué falta.
- [docs/development/DECISIONS.md](docs/development/DECISIONS.md) — decisiones técnicas y por qué.

`docs/brand-product/` y `docs/legal-functional/` son la interpretación estructurada de
los PDFs en `pdf/` (`Brand-Product-Book` y `Blueprint-Legal-Funcional`). No releer los
PDFs salvo que falte información, haya contradicción, o se necesite verificar un detalle
visual/legal exacto.

## Estructura del monorepo

```
apps/
  mobile/   React Native + Expo (producto principal)
  web/      Next.js (landing, legal, descarga)
  admin/    Next.js (panel administrativo)
  api/      Next.js route handlers (presentación fina sobre los packages de dominio)

packages/
  domain/         entidades de negocio, enums, interfaces (auth, maps, prices)
  optimization/   motor de optimización — TypeScript puro, sin React/RN/Next
  database/       schema.prisma + seed procedural
  validation/      schemas Zod
  types/          tipos/DTOs compartidos
  design-tokens/  colores, tipografía, spacing, motion tokens
  api-client/     cliente HTTP tipado
  config/         tsconfig/eslint compartidos
```

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env
```

Postgres local (requiere Docker, no disponible en todos los entornos de desarrollo):

```bash
docker compose up -d
pnpm --filter @depaso/database exec prisma migrate dev
pnpm --filter @depaso/database run seed
```

## Comandos

```bash
pnpm dev         # todas las apps en modo desarrollo (turbo)
pnpm typecheck   # typecheck de todo el monorepo
pnpm test        # tests de todo el monorepo (motor de optimización, etc.)
pnpm build       # build de todo el monorepo
```
