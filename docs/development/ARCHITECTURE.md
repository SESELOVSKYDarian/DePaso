# Arquitectura técnica

Fuente de intención de producto: `docs/brand-product/`, `docs/legal-functional/`. Este
documento describe cómo se traduce esa intención en código, no repite las reglas de
negocio (están en `BUSINESS-RULES.md`/`FUNCTIONAL.md`).

## Vista general

```
                         DEPASO
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
       mobile              web              admin
 Expo + Expo Router      Next.js           Next.js
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                       apps/api
                 Next.js route handlers
                    (capa de presentación)
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
      @depaso/domain  @depaso/optimization  @depaso/database
     (entidades, providers)  (motor puro)     (Prisma + Postgres)
```

`apps/api` es deliberadamente fina: valida el request (Zod, `@depaso/validation`), llama a
`@depaso/optimization` o a Prisma, y devuelve la respuesta. La lógica de negocio no vive en
route handlers ni en componentes de UI (regla 8 del master prompt).

## Packages y su responsabilidad

| Package | Responsabilidad | Depende de |
|---|---|---|
| `types` | DTOs/entidades compartidas + enums de dominio | — |
| `domain` | Interfaces de proveedores externos (`MapProvider`, `RouteProvider`, `GeocodingProvider`, `PriceProvider`), interfaz de auth (`AuthProvider`) | `types` |
| `optimization` | Motor de optimización — TypeScript puro, sin React/RN/Next | `domain`, `types` |
| `validation` | Schemas Zod (request de `/api/optimize`, entidades) | `types` |
| `database` | `schema.prisma`, cliente Prisma, seed procedural | `@prisma/client` |
| `design-tokens` | Colores, tipografía, spacing, motion — fuente única de verdad visual | — |
| `api-client` | Cliente HTTP tipado con Zod, para mobile/web/admin | `validation` |
| `config` | tsconfig y eslint compartidos | — |

Regla de dependencia: `optimization` y `domain` nunca importan React/React
Native/Next — así se pueden correr desde tests, workers o scripts (sección 57 del master
prompt). `apps/*` son los únicos consumidores de UI.

## Por qué esta separación (y no otra)

- **`optimization` separado de `database`:** el motor recibe `StoreCandidateInput[]` ya
  armados — no sabe de Prisma. Así se puede testear con datos de memoria (como hacen los
  tests de este pase) y más adelante conectarlo a Postgres, a un cache, o a datos mockeados
  para demos, sin tocar el algoritmo.
- **`domain` separado de `types`:** `types` son formas de datos (qué campos tiene un
  `Price`). `domain` son contratos de comportamiento (cómo se calcula una ruta, cómo se
  autentica un usuario) — cambian por razones distintas y a velocidades distintas.
- **Providers como interfaces:** sin API keys de mapas todavía (sección 67), el motor usa
  `MockRouteProvider` (haversine + inserción más barata). El día que haya una key de
  Google Routes/Mapbox, se implementa `GoogleRoutesProvider`/`MapboxProvider` cumpliendo la
  misma interfaz — cero cambios en `optimize.ts`.

## Auth

Sin credenciales de ningún proveedor externo en este entorno (ver
`docs/development/DECISIONS.md`, decisión 2026-09-11). `AuthProvider` (en `@depaso/domain`)
define el contrato; la implementación de referencia (Fase 4, **implementada**) vive en
`apps/api/lib/auth/`: `password.ts` (hash `scrypt` de Node, sin dependencia nueva),
`session.ts` (sesión sobre Prisma, se guarda el hash del token no el token),
`authProvider.ts` (compone ambos en un `AuthProvider`). Los route handlers
(`app/api/auth/*`) son los únicos que tocan cookies/headers — nunca lógica de sesión
directamente. Diseñado para poder swapear a un proveedor externo (ej. Supabase Auth)
implementando la misma interfaz, sin tocar el resto del backend. Detalle de endpoints:
`docs/development/API.md`.

## Mapas y ruteo

`MapProvider` = `{ geocoding: GeocodingProvider; routing: RouteProvider }`. Implementación
actual: `createMockRouteProvider()` en `@depaso/optimization` — suma distancias en línea
recta (haversine) entre waypoints, sin calles reales. Es funcional para probar el producto
end-to-end sin depender de un proveedor pago; se reemplaza por un proveedor real sin tocar
el resto del motor.

## Estado de cada app en este pase

| App | Estado |
|---|---|
| `apps/mobile` | Shell de navegación (5 tabs), onboarding, login/registro reales (Fase 4-5), modal de consentimiento de ubicación, pantallas legales nativas, CRUD real de lugares guardados con geocoding nativo (Fase 6), contexto de ruta de hoy + presets guardados (Fase 7). Corre de verdad en **Expo Web** (`npx expo start --web`) — ver `PROGRESS.md`. Sin listas/precios/optimización conectados todavía — eso es Fase 8+. |
| `apps/web` | Landing + `/privacy`, `/terms`, `/community-guidelines` (contenido real donde ya está definido, marcado como pendiente donde depende de datos de negocio no definidos). |
| `apps/admin` | Scaffold bootable con el mapa de secciones previstas (sección 7), sin pantallas funcionales. |
| `apps/api` | `POST /api/optimize` y toda la auth (`register`/`login`/`logout`/`me`/`account`), `UserPlace` CRUD, `route-contexts` CRUD y `consents` — **probados de punta a punta contra Postgres real** (ver `docs/development/PROGRESS.md`, Sesión 7). `account` (eliminar cuenta) y recuperación de contraseña siguen sin probar en vivo. |

Ver `PROGRESS.md` para el detalle de qué falta por fase.
