# Directorio de DePaso

Monorepo pnpm + Turborepo. Todo lo de un tema vive en una sola carpeta.

## Aplicaciones (`apps/`)

| Carpeta | Qué es |
|---|---|
| `apps/api/` | Backend: API REST en Next.js. **Sin GET: POST (leer y crear), PUT (actualizar) y DELETE (borrar).** Corre en EasyPanel. |
| `apps/mobile/` | App Expo / React Native (el producto). |
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
| `app/api/{promos,catalog}/` | Tareas de mantenimiento (fotos, promos, popularidad): corren solas desde `instrumentation.ts`; los endpoints sirven para correrlas a mano. |

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
| `lib/integrations/` | Servicios externos: mail, geocodificación y buscador de lugares (`placeSearch.ts`). |
| `lib/home/` | Inicio: novedades, resumen de la lista activa y productos baratos / recomendados. |

### App móvil (`apps/mobile/`)

| Carpeta | Qué tiene |
|---|---|
| `app/` | **Solo rutas** (Expo Router). Cada archivo es una línea que apunta a su pantalla en `features/`. |
| `features/<pantalla>/` | Una carpeta por pantalla grande: `<Nombre>Screen.tsx` (arma la pantalla), `components/` (partes), `use<Nombre>.ts` (estado y lógica), `styles.ts`, `helpers.ts`, `types.ts`. |
| `components/common/` | Piezas reutilizables: botones, tarjetas, diálogos, toast, formularios. |
| `components/auth/` | Piezas del registro e inicio de sesión (incluye los botones de redes sociales). |
| `components/map/` | Mapas, buscador de lugares (`PlaceSearchBox`), botón de ubicación (`LocateButton`), selector de punto y de desvío. |
| `components/lists/` | Piezas de listas y productos. |
| `lib/auth/` | `AuthContext` (estado global del login) y `secureStore` (tokens guardados en el celular). |
| `lib/apiClient.ts` | Clientes de la API y renovación automática del access token. |
| `lib/theme/` | Tema claro / oscuro. |
| `lib/responsive/` | Tamaño de pantalla (celular, tablet, escritorio) y giro del dispositivo. |
| `features/route-choice/` | "Elegí tu recorrido": elegir una ruta guardada y salir en un toque (`/route-context`). |
| `features/route-context/` | "Armar ruta" (`/route-builder`): paradas, búsqueda de lugares y guardar la ruta con nombre. |
| `lib/routeContext/` | Recorrido de hoy: se guarda en el celular y se reinicia a las 00:00 (`todayRouteStorage`, `dayStamp`, `useMidnightReset`). |
| `lib/products/productIcon.ts` | Ícono por tipo de producto cuando no hay foto. |
| `lib/location/`, `lib/places/usePlaceSearch.ts` | Ubicación actual del usuario (con permisos) y búsqueda de lugares mientras se escribe. |
| `lib/map/mapCommands.ts` | Órdenes que la app le manda al mapa: mover la cámara, punto azul, pin de búsqueda. |
| `lib/{lists,places,routeContext,purchase,voice}/` | Estado y lógica por tema. |

Todas las pantallas viven en `features/`, agrupadas por área:

| Área | Pantallas |
| --- | --- |
| `home`, `lists`, `list-detail`, `product-search`, `assistant` | Inicio, mis listas, detalle de una lista, buscar productos y armar con IA. |
| `route-choice`, `route-context`, `map`, `optimization`, `purchase` | Elegir o armar el recorrido, mapa, Top 3 de compra y Modo compra. |
| `places`, `place-form`, `preferences`, `payment-methods`, `detour`, `appearance` | Lugares, preferencias de marca y comercio, medios de pago, desvío y tema. |
| `auth`, `onboarding`, `setup` | Ingreso, registro, recuperar contraseña, bienvenida y primeros pasos. |
| `profile`, `activity`, `notifications`, `privacy`, `help`, `legal` | Perfil, reportes de la comunidad, avisos, datos personales, ayuda y textos legales. |
| `merchant-request`, `merchant-panel`, `merchant-price-form`, `admin`, `report-price` | Comercio, administración y reporte de precios. |
| `navigation` | Las pantallas registradas en la raíz (`RootNavigator`). |

## Paquetes (`packages/`)

| Carpeta | Qué es |
|---|---|
| `database/` | Esquema Prisma (MySQL, 3FN), migraciones, seed y el script `postgres-to-mysql.ts`. Los logos de las cadenas están en `seed/store-logos/` y `scripts/seed-brand-logos.ts` los carga en la tabla `brand_logos` (lo corre solo el contenedor al arrancar). |
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
| `Dockerfile.web`, `nginx.web.conf` | Imagen de la versión web de la app (Expo exportado + nginx) para EasyPanel. |
| `docker-compose.yml` | MySQL local para desarrollo. |
| `.env.example` | Variables de entorno (sin valores reales). |
| `docs/GUIA-DE-INSTALACION.md` | Cómo instalar y configurar backend, base de datos y app. |
| `docs/MANUAL-DE-USUARIO.md` | Cómo usar la app (con capturas). |
| `docs/manual/` | Capturas (`img/`) y `build-pdf.mjs`, que genera `DePaso-Manual-de-usuario.pdf` desde el manual. |
| `promo-video/` | Videos con Remotion: presentación horizontal (`npm run render`) y reel publicitario vertical (`npm run reel`), solo música. |
| `promo-video/hyperframes/` | Escena "realista" del reel (noche, lluvia, precios) hecha en HyperFrames; `npm run reel` la renderiza primero. |
| `apps/api/README.md` | Documentación de todos los endpoints. |
| `apps/api/tests/e2e.mjs` | Prueba de punta a punta de la API. |
| `docs/development/DEPLOY-EASYPANEL.md` | Deploy, variables y cron jobs. |
| `docs/development/DATABASE.md` | Modelo de datos, normalización y decisiones. |
