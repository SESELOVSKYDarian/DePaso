# Directorio de DePaso

Monorepo pnpm + Turborepo. Todo lo de un tema vive en una sola carpeta.

## Aplicaciones (`apps/`)

| Carpeta | Qué es |
|---|---|
| `apps/api/` | Backend: API REST en Next.js. **Sin GET: POST (leer y crear), PUT (actualizar) y DELETE (borrar).** Corre en EasyPanel. |
| `apps/mobile/` | App Expo / React Native (el producto). |
| `apps/web/` | Sitio web (landing, legales, descarga). |
| `apps/admin/` | Panel de administración web. |

### Backend (`apps/api/`)

**Endpoints (`app/api/`)** — una carpeta por recurso y un `route.ts` por acción.

| Ruta | Responsabilidad |
|---|---|
| `app/api/<recurso>/route.ts` | Crear (POST), actualizar (PUT) y borrar (DELETE) el recurso. |
| `app/api/<recurso>/{list,detail}/route.ts` | Listar y ver (POST), cada acción en su carpeta. |
| `app/api/auth/` | Registro, login, refresh de tokens, logout, recuperar contraseña, OAuth. |
| `app/api/{lists,places,preferences,route-contexts,payment-methods}/` | Datos del usuario. |
| `app/api/{merchant,admin}/` | Funciones por rol (comercio y administrador). |
| `app/api/{products,stores,home,community,optimization,routes,geocode}/` | Catálogo, precios y recorridos. |
| `app/api/{promos,catalog}/` | Tareas programadas (cron de EasyPanel). |

**Lógica (`lib/`)** — una subcarpeta por tema.

| Carpeta | Qué tiene |
|---|---|
| `lib/auth/` | JWT (`jwt.ts`), sesiones y refresh (`session.ts`), contraseñas, OAuth, límite de intentos, roles (`requireAdmin`, `requireMerchant`). |
| `lib/http/` | `postAdapter.ts` (pasa ids y filtros del body JSON a cada handler) y `background.ts` (tareas en segundo plano). |
| `lib/user/` | Lugares, preferencias y recorridos guardados del usuario. |
| `lib/lists/` | Listas de compra. |
| `lib/catalog/` | Productos, marcas, imágenes, búsqueda, precios por consenso y mantenimiento del catálogo. |
| `lib/promos/` | Promociones bancarias: sincronizar, buscar y aplicar al plan. |
| `lib/routes/` | Rutas, comercios cerca del camino y armado del plan de compra. |
| `lib/assistant/` | Asistente de listas: IA (`llm.ts`), voz a texto (`stt.ts`) y separación del texto en productos. |
| `lib/merchant/` | Solicitudes y precios del comercio. |
| `lib/integrations/` | Servicios externos: mail y geocodificación. |
| `lib/home/` | Novedades de la pantalla de inicio. |

### App móvil (`apps/mobile/`)

| Carpeta | Qué tiene |
|---|---|
| `app/` | **Solo rutas** (Expo Router). Cada archivo es una línea que apunta a su pantalla en `features/`. |
| `features/<pantalla>/` | Una carpeta por pantalla grande: `<Nombre>Screen.tsx` (arma la pantalla), `components/` (partes), `use<Nombre>.ts` (estado y lógica), `styles.ts`, `helpers.ts`, `types.ts`. |
| `components/common/` | Piezas reutilizables: botones, tarjetas, diálogos, toast, formularios. |
| `components/auth/` | Piezas del registro e inicio de sesión (incluye los botones de redes sociales). |
| `components/map/` | Mapas, selector de punto y selector de desvío. |
| `components/lists/` | Piezas de listas y productos. |
| `lib/auth/` | `AuthContext` (estado global del login) y `secureStore` (tokens guardados en el celular). |
| `lib/apiClient.ts` | Clientes de la API y renovación automática del access token. |
| `lib/theme/` | Tema claro / oscuro. |
| `lib/{lists,places,routeContext,purchase,voice}/` | Estado y lógica por tema. |

Pantallas que ya están divididas en `features/`: `assistant`, `route-context`, `map`, `list-detail`,
`product-search`, `merchant-request`, `merchant-panel`, `place-form`, `home`.

## Paquetes (`packages/`)

| Carpeta | Qué es |
|---|---|
| `database/` | Esquema Prisma (MySQL, 3FN), migraciones, seed y el script `postgres-to-mysql.ts`. |
| `validation/` | Esquemas zod compartidos entre API y app (validación en las dos puntas). |
| `api-client/` | Cliente HTTP tipado que usa la app; un archivo por tema. |
| `domain/`, `types/` | Reglas, constantes y tipos de negocio. |
| `optimization/` | Motor de recorridos (sin desvíos, intermedio, hipereconómico). |
| `geo/` | Distancias, zonas y normalización de direcciones. |
| `data-sources/sepa/` | Importador de precios SEPA (`pnpm data:sepa:import`). `src/importJob.ts` coordina y `src/import/` tiene cada paso (tiendas, sucursales, precios, variantes, resumen). |
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
| `apps/api/README.md` | Documentación de todos los endpoints. |
| `apps/api/tests/e2e.mjs` | Prueba de punta a punta de la API. |
| `docs/development/DEPLOY-EASYPANEL.md` | Deploy, variables y cron jobs. |
| `docs/development/DATABASE.md` | Modelo de datos, normalización y decisiones. |
