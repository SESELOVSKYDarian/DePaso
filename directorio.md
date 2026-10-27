# Directorio de DePaso

Monorepo pnpm + Turborepo.

- `apps/api/` — API Next.js (rutas en `app/api/`, lógica en `lib/`). Corre en EasyPanel.
- `apps/mobile/` — app Expo (pantallas en `app/`, componentes en `components/`, estado en `lib/`).
- `packages/database/` — esquema Prisma (MySQL), migraciones y scripts.
- `packages/data-sources/sepa/` — import de precios SEPA (`scripts/import.ts`).
- `packages/optimization/` — motor de rutas y planes (3 tipos de recorrido).
- `packages/validation/` — esquemas zod compartidos API/mobile.
- `packages/api-client/` — cliente HTTP tipado que usa la app.
- `packages/domain`, `types`, `geo`, `design-tokens` — reglas, tipos y diseño compartidos.
- `Dockerfile`, `.dockerignore` — imagen de la API para EasyPanel.
- `docs/development/DEPLOY-EASYPANEL.md` — pasos de deploy, variables y cron jobs.
