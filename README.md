# DePaso

**Ahorrá en el camino.**

Asistente de conveniencia cotidiana que calcula qué compra conviene según el recorrido
real de la persona — no un comparador de precios clásico. Lanzamiento inicial: sólo Mar
del Plata, Buenos Aires, Argentina.

> "DePaso" es working name sujeto a clearance marcario (riesgo ALTO). Ver
> [docs/brand-product/DECISIONS.md](docs/brand-product/DECISIONS.md).

## Qué hace

- **Registro e inicio de sesión** con email y contraseña, y con **Google, Meta (Facebook) y
  Discord**. Recuperación de contraseña por mail con código.
- **Tres roles** con permisos distintos: usuario, comercio (aprobado por un admin) y administrador.
- **Listas de compras** compartibles, con búsqueda por relevancia, filtros por tipo y marca y un
  **asistente con IA por voz** para armarlas hablando.
- **Optimización de compra**: compara precios (dataset oficial SEPA + comunidad + comercios) y
  propone hasta 3 planes según tu recorrido, con promos de bancos y billeteras.
- **Comunidad**: reportes de precios con moderación y puntaje de confianza.
- App móvil con **modo claro y oscuro** y sesión persistente (sigue conectado al cerrar y reabrir la app).

## Documentación

| Documento | Para qué |
|---|---|
| [docs/GUIA-DE-INSTALACION.md](docs/GUIA-DE-INSTALACION.md) | Instalar y configurar backend, base de datos y app (variables de entorno, ejecución, APK, despliegue) |
| [docs/MANUAL-DE-USUARIO.md](docs/MANUAL-DE-USUARIO.md) | Cómo usar la app, paso a paso, según el rol |
| [docs/development/API.md](docs/development/API.md) | Referencia de la API REST: endpoints, métodos, parámetros, respuestas y errores |
| [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md) | Arquitectura técnica |
| [docs/development/DATABASE.md](docs/development/DATABASE.md) | Modelo de datos |
| [docs/development/DECISIONS.md](docs/development/DECISIONS.md) | Decisiones técnicas y por qué |
| [docs/development/PROGRESS.md](docs/development/PROGRESS.md) | Estado actual y qué falta |
| [docs/README.md](docs/README.md) | Índice de la documentación de producto, marca y legal |

`docs/brand-product/` y `docs/legal-functional/` son la interpretación estructurada de
los PDFs en `pdf/` (`Brand-Product-Book` y `Blueprint-Legal-Funcional`). No releer los
PDFs salvo que falte información, haya contradicción, o se necesite verificar un detalle
visual/legal exacto.

## Tecnologías

| Capa | Tecnología |
|---|---|
| App móvil | React Native 0.88 + **Expo SDK 58** + Expo Router, TypeScript, Context API para el estado global |
| Sesión persistente | Token guardado en `expo-secure-store` (Keychain / Keystore) |
| Backend / API | Node.js 22 con Next.js 15 (*route handlers*), API REST |
| Base de datos | PostgreSQL con Prisma (alojada en Supabase) |
| Autenticación | Sesiones con token propio (hash en base, 30 días) + OAuth 2.0 con PKCE |
| Validación | Zod, compartida entre app y API |
| Mapas y rutas | Mapbox |
| IA | API compatible con OpenAI (chat) + Whisper para voz |
| Monorepo | pnpm workspaces + Turborepo |
| Despliegue | Vercel (API) y EAS Build (APK) |

## Estructura del monorepo

```
apps/
  mobile/   React Native + Expo (producto principal)
  web/      Next.js (landing, legal, descarga)
  admin/    Next.js (panel administrativo)
  api/      Next.js route handlers (presentación fina sobre los packages de dominio)

packages/
  domain/         entidades de negocio, enums, interfaces (auth, maps, prices, tipos de producto)
  optimization/   motor de optimización — TypeScript puro, sin React/RN/Next
  database/       schema.prisma + migraciones + seed procedural
  validation/      schemas Zod
  types/          tipos/DTOs compartidos
  design-tokens/  colores, tipografía, spacing, motion tokens
  api-client/     cliente HTTP tipado
  data-sources/   importadores (SEPA, Mapbox)
  config/         tsconfig/eslint compartidos
```

## Puesta en marcha rápida

Requisitos: Node 22.13+ y pnpm (`corepack enable`). Detalle completo, variables de entorno y
base de datos en la [Guía de instalación](docs/GUIA-DE-INSTALACION.md).

```bash
corepack enable
pnpm install
cp .env.example .env                 # completar DATABASE_URL y AUTH_SESSION_SECRET
docker compose up -d                 # PostgreSQL local (o usar Supabase)
pnpm --filter @depaso/database exec prisma migrate deploy
pnpm --filter @depaso/database run seed
pnpm --filter @depaso/api dev        # API en http://localhost:3000
cd apps/mobile && npx expo start     # escanear el QR con Expo Go (SDK 58)
```

## Comandos

```bash
pnpm dev         # todas las apps en modo desarrollo (turbo)
pnpm typecheck   # typecheck de todo el monorepo
pnpm test        # tests de todo el monorepo (motor de optimización, auth, etc.)
pnpm build       # build de todo el monorepo
```

## Notas técnicas para la evaluación

Decisiones que se apartan de lo más habitual, y por qué:

- **Base de datos: PostgreSQL** (no MySQL). Es el motor definido desde la arquitectura inicial
  del proyecto (ver [DECISIONS.md](docs/development/DECISIONS.md)) y hoy está alojado en
  Supabase. El acceso pasa por Prisma, así que el modelo de datos vive en un solo lugar
  ([`schema.prisma`](packages/database/prisma/schema.prisma)); pasar a MySQL implicaría cambiar
  el `provider`, regenerar las migraciones y revisar el SQL crudo de la búsqueda de productos.
- **Sesiones con token propio** en lugar de JWT: el token es opaco, se guarda hasheado (SHA-256)
  en la tabla `sessions` y se puede revocar al instante (cerrar sesión, cambiar contraseña).
  Vale 30 días y no hay token de renovación aparte. Detalle en
  [docs/development/API.md](docs/development/API.md#convenciones).
- **Roles** (`USER`, `MERCHANT`, `ADMIN`) verificados en el servidor en cada ruta protegida.
