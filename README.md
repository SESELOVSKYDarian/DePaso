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
| [apps/api/README.md](apps/api/README.md) | Referencia de la API REST: endpoints, métodos, parámetros, respuestas y errores |
| [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md) | Arquitectura técnica |
| [docs/development/DATABASE.md](docs/development/DATABASE.md) | Modelo de datos |
| [docs/development/DECISIONS.md](docs/development/DECISIONS.md) | Decisiones técnicas y por qué |
| [docs/README.md](docs/README.md) | Índice de la documentación de producto, marca y legal |

`docs/brand-product/` y `docs/legal-functional/` son la interpretación estructurada de
los PDFs en `pdf/` (`Brand-Product-Book` y `Blueprint-Legal-Funcional`). No releer los
PDFs salvo que falte información, haya contradicción, o se necesite verificar un detalle
visual/legal exacto.

## Tecnologías

| Capa | Tecnología |
|---|---|
| App móvil | React Native 0.88 + **Expo SDK 58** + Expo Router, TypeScript, Context API para el estado global |
| Sesión persistente | Access token JWT + refresh token guardados en `expo-secure-store` (Keychain / Keystore) |
| Backend / API | Node.js 22 con Next.js 15 (*route handlers*), API REST (POST para leer y crear, PUT para actualizar, DELETE para borrar; nunca GET) |
| Base de datos | **MySQL 8** con Prisma (servicio MySQL de EasyPanel) |
| Autenticación | JWT (access 15 min) + refresh token rotativo (30 días) + login social OAuth 2.0 con PKCE (Google, Facebook, Discord) |
| Validación | Zod, compartida entre app y API |
| Mapas y rutas | Mapbox |
| IA | API compatible con OpenAI (chat) + Whisper para voz |
| Monorepo | pnpm workspaces + Turborepo |
| Despliegue | EasyPanel con Docker (API + MySQL) y EAS Build (APK) |

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
docker compose up -d                 # MySQL local
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

## Cumplimiento de la consigna

| Requisito | Dónde está |
|---|---|
| Registro e inicio de sesión | `POST /api/auth/register` y `/login`; pantallas en `apps/mobile/app/(auth)` |
| Login con 3 redes sociales | Google, Facebook (Meta) y Discord — `apps/api/lib/auth/oauthProviders.ts` |
| 3 roles con permisos distintos | `USER`, `MERCHANT`, `ADMIN` — `requireMerchant` / `requireAdmin` protegen las rutas; la app muestra paneles según el rol |
| UI móvil con navegación | Expo Router: tabs (Inicio, Listas, Mapa, Perfil) + pantallas; tema claro/oscuro |
| API RESTful con CRUD | Listas, ítems, lugares, preferencias, rutas, precios: crear / leer / actualizar / eliminar |
| Estado global con Context API | `AuthContext`, `ListsContext`, `PlacesContext`, `ThemeContext` en `apps/mobile/lib` |
| Sesión persistente | Tokens en `expo-secure-store`; la app renueva el access token sola con el refresh token |
| Manejo de errores | Validación en formularios (Zod) y mensajes por código de error de la API |
| JWT con acceso y renovación | `apps/api/lib/auth/jwt.ts` y `session.ts`; `POST /api/auth/refresh` |
| MySQL | `packages/database/prisma/schema.prisma` (provider `mysql`) + migración inicial |
| Gestión de roles | Rol leído de la base en cada request, nunca del body |
| Documentación de la API | [apps/api/README.md](apps/api/README.md) |
| Manual de usuario | [docs/MANUAL-DE-USUARIO.md](docs/MANUAL-DE-USUARIO.md) |
| Guía de instalación | [docs/GUIA-DE-INSTALACION.md](docs/GUIA-DE-INSTALACION.md) |
| APK | `eas build -p android --profile preview` (ver la guía, sección 7) |

## Notas técnicas

- **Nunca se usa GET**: leer y crear es POST, actualizar es PUT y borrar es DELETE. Ids y filtros viajan en el body JSON, no en la URL. La única
  excepción es `GET /api/auth/oauth/callback`, la URL a la que Google/Facebook/Discord redirigen
  (solo redirigen con GET).
- **JWT**: el access token dura 15 minutos y se firma con `AUTH_SESSION_SECRET` (HS256). El refresh
  token es opaco, se guarda hasheado en la tabla `sessions` y rota en cada canje. Detalle en
  [apps/api/README.md](apps/api/README.md#autenticación-con-jwt-access--refresh).
- **Roles** (`USER`, `MERCHANT`, `ADMIN`) verificados en el servidor en cada ruta protegida.
- **Base de datos**: Prisma abstrae el motor; el SQL crudo de la búsqueda de productos está escrito
  para MySQL 8 (ver [DATABASE.md](docs/development/DATABASE.md)).
