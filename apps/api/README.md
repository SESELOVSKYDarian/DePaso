# DePaso — API (backend)

API REST en Next.js (*route handlers*) sobre **MySQL 8** con Prisma. Autenticación con **JWT** (access +
refresh) y roles `USER`, `MERCHANT` y `ADMIN`.

Este archivo es la documentación de la API: convenciones, autenticación, roles, errores y todos los
endpoints con sus métodos, parámetros, respuestas y códigos de error. También hay una prueba de punta a
punta: [`tests/e2e.mjs`](tests/e2e.mjs).

## Cómo correrla

```bash
# desde la raíz del repo
pnpm install
cp .env.example .env              # DATABASE_URL (mysql://...) y AUTH_SESSION_SECRET
docker compose up -d              # MySQL local en el puerto 3306
pnpm --filter @depaso/database run migrate:deploy
pnpm --filter @depaso/database run seed      # datos de ejemplo (opcional)
pnpm --filter @depaso/api dev     # http://localhost:3000
```

Variables de entorno, deploy en EasyPanel y cron jobs: [GUIA-DE-INSTALACION.md](../../docs/GUIA-DE-INSTALACION.md)
y [DEPLOY-EASYPANEL.md](../../docs/development/DEPLOY-EASYPANEL.md).

Prueba de punta a punta (crea una cuenta de prueba, solo contra una API de desarrollo):

```bash
BASE_URL=http://localhost:3000 node apps/api/tests/e2e.mjs
```

## Convenciones

**Métodos HTTP.** Nunca se usa `GET`. Leer, listar y crear es `POST`; actualizar es `PUT`; borrar es
`DELETE`. Los datos (incluidos los ids y los filtros de búsqueda) viajan en el **body JSON**, nunca en la
URL.

| Acción | Método | Ejemplo |
|---|---|---|
| Crear | `POST` | `POST /api/lists` |
| Listar / ver | `POST` | `POST /api/lists/list`, `POST /api/lists/detail` |
| Actualizar | `PUT` | `PUT /api/lists` con `{ "id": "...", "name": "..." }` |
| Borrar | `DELETE` | `DELETE /api/lists` con `{ "id": "..." }` |

Única excepción: `GET /api/auth/oauth/callback`, la URL de retorno a la que redirige Google, Facebook y
Discord (los proveedores solo redirigen con GET). No guarda datos: reenvía el `code` a la app.

**Formato.** `Content-Type: application/json`, salvo `POST /api/ai/transcribe` (multipart con el audio).

**CORS.** Para la versión web, `CORS_ALLOWED_ORIGINS` (dominios separados por coma) limita qué sitios pueden
llamar desde un navegador. Si no se define, se acepta cualquier origen.

### Autenticación con JWT (access + refresh)

| Token | Qué es | Duración |
|---|---|---|
| `token` (access) | JWT HS256 firmado con `AUTH_SESSION_SECRET`. Lleva `sub` (usuario), `sid` (sesión) y `exp`. | 15 minutos |
| `refreshToken` | Valor aleatorio opaco. En la base solo se guarda su hash SHA-256. | 30 días |

1. `register`, `login` y `oauth/{proveedor}` devuelven `{ user, token, expiresAt, refreshToken, refreshExpiresAt }`.
2. Cada request protegida manda `Authorization: Bearer <token>` (la web también acepta la cookie `depaso_session`).
3. Cuando el access vence, el servidor responde `401`. El cliente llama a `POST /api/auth/refresh` con el
   `refreshToken` y recibe un par **nuevo**; el refresh anterior queda revocado (rotación), así que usarlo
   dos veces falla. La app hace esto sola y reintenta el pedido.
4. `logout` revoca la sesión al instante: el access token deja de servir aunque no haya vencido. Eliminar la
   cuenta revoca todas las sesiones.

### Roles

`USER` (por defecto), `MERCHANT` (comercio aprobado por un admin) y `ADMIN`. El rol se lee del usuario en la
base en cada request, nunca del body. Un rol insuficiente responde `403 FORBIDDEN`.

| Marca | Quién puede |
|---|---|
| 🌐 | Público (sin sesión) |
| 🔒 | Cualquier usuario con sesión |
| 🏪 | Rol `MERCHANT` |
| 🛡️ | Rol `ADMIN` |
| ⏱️ | Cron: `Authorization: Bearer $CRON_SECRET` (o un admin) |

### Errores

Siempre `{ "error": "CODIGO" }`. En `400` se agrega `issues` con el detalle de validación.

| HTTP | Cuándo |
|---|---|
| 400 | `INVALID_REQUEST` (datos inválidos o falta un id), `INVALID_OR_EXPIRED_TOKEN` |
| 401 | `UNAUTHORIZED` (sin sesión o access vencido), `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN` |
| 403 | `FORBIDDEN` (rol insuficiente) |
| 404 | No existe o no es tuyo (se responde 404, no 403, para no revelar recursos ajenos) |
| 405 | Se usó un método que el endpoint no tiene (por ejemplo `GET`) |
| 409 | Conflicto (`EMAIL_ALREADY_REGISTERED`, `ALREADY_PENDING`, `STORE_HAS_BRANCHES`…) |
| 413 | `AUDIO_TOO_LARGE` |
| 422 | `EMAIL_UNAVAILABLE`, `NOTHING_UNDERSTOOD`, `OPTIMIZATION_FAILED`… |
| 429 | `RATE_LIMITED` (demasiados intentos) |
| 502 / 503 | Falla un servicio externo (mapas, mail, voz) o no está configurado |

## Ejemplo completo

```bash
# 1. login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"MiClave1234"}'
# -> { "user": {...}, "token": "eyJ...", "refreshToken": "x8f...", "expiresAt": "...", "refreshExpiresAt": "..." }

# 2. crear una lista
curl -X POST http://localhost:3000/api/lists \
  -H "Authorization: Bearer eyJ..." -H "Content-Type: application/json" \
  -d '{"name":"Compra del sábado"}'

# 3. renombrarla (PUT) y borrarla (DELETE)
curl -X PUT http://localhost:3000/api/lists \
  -H "Authorization: Bearer eyJ..." -H "Content-Type: application/json" \
  -d '{"id":"<id de la lista>","name":"Compra renombrada"}'
curl -X DELETE http://localhost:3000/api/lists \
  -H "Authorization: Bearer eyJ..." -H "Content-Type: application/json" \
  -d '{"id":"<id de la lista>"}'

# 4. el access venció (401): renovar
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" -d '{"refreshToken":"x8f..."}'
```

Los campos de cada body están definidos con Zod en
[`packages/validation/src`](../../packages/validation/src) (la columna **Body** dice cuál) y hay un cliente
tipado en [`packages/api-client`](../../packages/api-client/src).

## Autenticación

| Método y endpoint | Acceso | Body | Errores |
|---|---|---|---|
| `POST /api/auth/register` | 🌐 | `registerRequestSchema` — email, password, displayName?, `ageConfirmed18Plus`, `acceptTerms`, `acceptPrivacyNotice`, marketingOptIn? | 400, 409 `EMAIL_ALREADY_REGISTERED`, 429 |
| `POST /api/auth/login` | 🌐 | `loginRequestSchema` — email, password | 400, 401 `INVALID_CREDENTIALS`, 429 |
| `POST /api/auth/refresh` | 🌐 | `refreshRequestSchema` — refreshToken | 400, 401 `INVALID_REFRESH_TOKEN` |
| `POST /api/auth/logout` | 🌐 | — | — |
| `POST /api/auth/me` | 🔒 | — (devuelve el usuario) | 401 |
| `PUT /api/auth/me` | 🔒 | `updateProfileRequestSchema` — displayName?, marketingOptIn? | 400, 401 |
| `DELETE /api/auth/account` | 🔒 | — (borra la cuenta y revoca las sesiones) | 401 |
| `POST /api/auth/forgot-password` | 🌐 | `forgotPasswordRequestSchema` — email | 400, 429, 503 |
| `POST /api/auth/verify-reset-code` | 🌐 | `verifyResetCodeRequestSchema` — email, código de 8 dígitos | 400, 429 |
| `POST /api/auth/reset-password` | 🌐 | `resetPasswordRequestSchema` — token o código + nueva contraseña | 400, 429 |
| `POST /api/auth/providers` | 🌐 | — (qué redes sociales están configuradas) | — |
| `POST /api/auth/oauth/{google\|facebook\|discord}` | 🌐 | `oauthLoginRequestSchema` — code, redirectUri, codeVerifier (PKCE), consent? | 400, 401, 404, 409, 422, 502, 503 |
| `GET /api/auth/oauth/callback` | 🌐 | query del proveedor (`code`, `state`) → redirige a la app | 400 |

## Listas de compra (CRUD)

| Método y endpoint | Acceso | Body | Errores |
|---|---|---|---|
| `POST /api/lists` (crear) | 🔒 | `shoppingListInputSchema` — name | 400, 401 |
| `POST /api/lists/list` | 🔒 | — | 401 |
| `POST /api/lists/detail` | 🔒 | `{ id }` | 404 |
| `PUT /api/lists` | 🔒 | `{ id, ...shoppingListUpdateSchema }` — name?, archived? (solo el dueño) | 400, 404 |
| `DELETE /api/lists` | 🔒 | `{ id }` (solo el dueño) | 404 |
| `POST /api/lists/{id}/items` (agregar) | 🔒 | `shoppingListItemInputSchema` — productId, quantity, note? | 400, 404 |
| `PUT /api/lists/items` | 🔒 | `{ id, itemId, ...shoppingListItemUpdateSchema }` | 400, 404 |
| `DELETE /api/lists/items` | 🔒 | `{ id, itemId }` | 404 |
| `POST /api/lists/{id}/members` (compartir) | 🔒 | `shoppingListShareInputSchema` — email | 400, 404, 429 |
| `DELETE /api/lists/members` | 🔒 | `{ id, memberUserId }` | 404 |

## Lugares, preferencias y pagos del usuario

| Recurso | Crear (POST) | Listar (POST) | Actualizar (PUT) | Borrar (DELETE) |
|---|---|---|---|---|
| `/api/places` | `userPlaceInputSchema` | `/api/places/list` | `{ id, ... }` | `{ id }` |
| `/api/route-contexts` | `routeContextInputSchema` | `/api/route-contexts/list` | — | `{ id }` |
| `/api/preferences/products` | `productPreferenceInputSchema` | `/api/preferences/products/list` | — | `{ productId }` |
| `/api/preferences/stores` | `storePreferenceInputSchema` | `/api/preferences/stores/list` | — | `{ id }` |
| `/api/payment-methods` | — | `/api/payment-methods/list` | `{ methods: string[] }` | — |

Todos con acceso 🔒. Además: `POST /api/consents` (`consentRequestSchema`) y `POST /api/account/export`
(descarga todos tus datos).

## Catálogo, precios y rutas

| Endpoint | Acceso | Body |
|---|---|---|
| `POST /api/products/search` | 🔒 | `{ q?, type?, brandId? }` |
| `POST /api/products/facets` | 🔒 | `{ q?, type?, brandId? }` |
| `POST /api/stores/branches` | 🔒 | — |
| `POST /api/home/feed` | 🔒 | — (resumen de tu lista, productos baratos y recomendados, cambios de precio y ofertas) |
| `POST /api/announcements/list` | 🔒 | — : novedades que publica el equipo (solo las activas) |
| `POST /api/activity/feed` | 🔒 | — : avisos propios: listas que te compartieron, productos de tus listas que bajaron y ofertas cerca de tus lugares |
| `POST/PUT/DELETE /api/admin/announcements`, `POST /api/admin/announcements/list` | 🔒 ADMIN | `announcementInputSchema` / `announcementUpdateSchema` — publicar, ocultar y borrar novedades |
| `POST /api/price-reports` | 🔒 | `priceReportInputSchema` (reportar un precio) |
| `POST /api/optimization` | 🔒 | `optimizationRunRequestSchema` (arma el recorrido de una lista) |
| `POST /api/optimize` | 🌐 | `optimizeRequestSchema` |
| `POST /api/routes/compute`, `/api/routes/nearby-stores` | 🔒 | `routeComputeRequestSchema`, `nearbyStoresRequestSchema` |
| `POST /api/geocode`, `/api/geocode/reverse` | 🔒 | dirección → coordenadas y al revés |
| `POST /api/stores/logos` | 🔒 | — : logos de las cadenas (Coto, Shell…) guardados en la base (`brand_logos` + `brand_logo_aliases`), como `data:image/png;base64` |
| `POST /api/geocode/search` | 🔒 | `placeSearchRequestSchema` — `{ q, latitude?, longitude? }`: sugerencias de lugares mientras se escribe (comercios como "Shell", escuelas como "Técnica 5", calles con número). Usa Photon (OpenStreetMap), limitado a Mar del Plata |
| `POST /api/config/mapbox-token` | 🔒 | — |
| `POST /api/ai/shopping-parse` | 🔒 | `assistantRequestSchema` — texto libre → lista |
| `POST /api/ai/transcribe` | 🔒 | multipart: audio |

## Comercio 🏪

| Método y endpoint | Acceso | Body |
|---|---|---|
| `POST /api/merchant/requests` (pedir ser comercio) | 🔒 | `merchantRequestInputSchema` |
| `POST /api/merchant/requests/list` | 🔒 | — |
| `POST /api/merchant/claimable-branches` | 🔒 | `{ q }` |
| `POST /api/merchant/branch` | 🏪 | — |
| `POST /api/merchant/prices` (cargar) | 🏪 | `merchantPriceInputSchema` |
| `POST /api/merchant/prices/list` | 🏪 | `{ q?, type?, brandId?, offset? }` |
| `PUT /api/merchant/prices` | 🏪 | `{ id, price, displayName? }` |
| `DELETE /api/merchant/prices` | 🏪 | `{ id }` |
| `POST /api/merchant/products` | 🏪 | `merchantProductInputSchema` |

## Administración 🛡️

| Método y endpoint | Body |
|---|---|
| `POST /api/admin/users`, `/api/admin/price-reports`, `/api/admin/optimization-runs` | — (listados) |
| `POST /api/admin/merchant-requests` | `{ status }` (`PENDING`, `APPROVED`, `REJECTED`) |
| `POST /api/admin/merchant-requests/{id}` | `merchantDecisionInputSchema` (aprobar o rechazar) |
| `POST /api/admin/moderation` | `moderationActionInputSchema` |
| `POST /api/admin/stores` · `/list` · `PUT` · `DELETE` | `storeInputSchema`; PUT y DELETE llevan `{ id }`. Borrar una cadena con sucursales responde 409 `STORE_HAS_BRANCHES` |
| `POST /api/admin/store-branches` · `/list` · `PUT` · `DELETE` | `storeBranchInputSchema`; list: `{ storeId? }` |
| `POST /api/admin/prices` · `/list` · `PUT` | `priceInputSchema`; list: `{ productVariantId?, storeBranchId? }` |

## Mantenimiento ⏱️ y salud

| Endpoint | Acceso | Para qué |
|---|---|---|
| `POST /api/promos/sync` | ⏱️ | Actualiza las promociones bancarias |
| `POST /api/catalog/refresh` | ⏱️ | Recalcula la popularidad de productos |
| `POST /api/catalog/images` | ⏱️ | Completa fotos del catálogo por EAN (Open Food Facts, Open Beauty Facts, Open Products Facts), 40 productos por corrida |
| `POST /api/health` | 🌐 | `{ "ok": true }` si la API llega a la base (503 si no) |
