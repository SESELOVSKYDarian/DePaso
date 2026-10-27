# Directorio de DePaso

Monorepo pnpm + Turborepo. Todo lo de un tema vive en una sola carpeta.

## Aplicaciones (`apps/`)

| Carpeta | Qué es |
|---|---|
| `apps/api/` | Backend: API REST en Next.js. **Todos los endpoints son POST.** Corre en EasyPanel. |
| `apps/mobile/` | App Expo / React Native (el producto). |
| `apps/web/` | Sitio web (landing, legales, descarga). |
| `apps/admin/` | Panel de administración web. |

### Backend (`apps/api/`)

| Ruta | Responsabilidad |
|---|---|
| `app/api/<recurso>/route.ts` | Crear (POST). Un archivo = un endpoint. |
| `app/api/<recurso>/{list,detail,update,delete}/route.ts` | Resto del CRUD, cada acción en su carpeta. |
| `app/api/auth/` | Registro, login, refresh de tokens, logout, recuperar contraseña, OAuth. |
| `app/api/{lists,places,preferences,route-contexts,payment-methods}/` | Datos del usuario. |
| `app/api/{merchant,admin}/` | Funciones por rol (comercio y administrador). |
| `app/api/{products,stores,home,community,optimization,routes,geocode}/` | Catálogo, precios y recorridos. |
| `app/api/{promos,catalog}/` | Tareas programadas (cron de EasyPanel). |
| `lib/auth/` | JWT (`jwt.ts`), sesiones y refresh (`session.ts`), contraseñas, OAuth, roles (`requireAdmin`, `requireMerchant`). |
| `lib/http/postAdapter.ts` | Pasa los ids y filtros del body JSON a lo que espera cada handler. |
| `lib/*.ts` | Lógica de negocio por tema (`lists`, `products`, `homeFeed`, `paymentPromos`, `planRoute`…). |

### App móvil (`apps/mobile/`)

| Ruta | Responsabilidad |
|---|---|
| `app/(tabs)/` | Las pestañas: Inicio, Listas, Mapa, Actividad, Perfil. |
| `app/(auth)/`, `app/auth/` | Bienvenida, login, registro, recuperar contraseña. |
| `app/lists/`, `places/`, `route-context/`, `optimization/`, `purchase/` | Pantallas de cada flujo. |
| `app/merchant/`, `app/admin/` | Pantallas según el rol. |
| `components/` | Componentes reutilizables. |
| `lib/auth/` | `AuthContext` (estado global del login), `secureStore` (tokens guardados en el celular). |
| `lib/apiClient.ts` | Clientes de la API + renovación automática del access token. |
| `lib/theme/` | Tema claro / oscuro. |

## Paquetes (`packages/`)

| Carpeta | Qué es |
|---|---|
| `database/` | Esquema Prisma (MySQL), migraciones y seed. |
| `validation/` | Esquemas zod compartidos entre API y app (validación en las dos puntas). |
| `api-client/` | Cliente HTTP tipado que usa la app; un archivo por tema. |
| `domain/`, `types/` | Reglas, constantes y tipos de negocio. |
| `optimization/` | Motor de recorridos (sin desvíos, intermedio, hipereconómico). |
| `geo/` | Distancias, zonas y normalización de direcciones. |
| `data-sources/sepa/` | Importador de precios SEPA (`pnpm data:sepa:import`). |
| `data-sources/mapbox/` | Mapas y rutas. |
| `design-tokens/` | Colores, espaciado y tipografías. |
| `config/` | tsconfig y eslint compartidos. |

## Raíz y documentación

| Archivo | Para qué |
|---|---|
| `README.md` | Presentación, instalación rápida y cumplimiento de la consigna. |
| `Dockerfile`, `.dockerignore` | Imagen de la API para EasyPanel. |
| `docker-compose.yml` | MySQL local para desarrollo. |
| `.env.example` | Variables de entorno (sin valores reales). |
| `docs/GUIA-DE-INSTALACION.md` | Cómo instalar y configurar backend, base de datos y app. |
| `docs/MANUAL-DE-USUARIO.md` | Cómo usar la app. |
| `docs/development/API.md` | Documentación de todos los endpoints. |
| `docs/development/DEPLOY-EASYPANEL.md` | Deploy, variables y cron jobs. |
| `docs/development/DATABASE.md` | Modelo de datos y decisiones. |
