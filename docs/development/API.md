# API de DePaso

API REST en `apps/api` (Next.js, *route handlers*) sobre MySQL. Local: `http://localhost:3000`.
Producción: la URL pública del servicio de EasyPanel (ver [DEPLOY-EASYPANEL.md](DEPLOY-EASYPANEL.md)).

Los campos de cada body están definidos con Zod en
[`packages/validation/src`](../../packages/validation/src) (la columna **Schema** dice cuál) y hay un
cliente tipado en [`packages/api-client`](../../packages/api-client/src).

Instalación: [GUIA-DE-INSTALACION.md](../GUIA-DE-INSTALACION.md).

## Convenciones

**Todo es POST.** Ningún endpoint usa GET, PUT, PATCH ni DELETE: los datos (incluidos los ids
y los filtros de búsqueda) viajan en el **body JSON**, nunca en la URL. La acción se lee en el
nombre del endpoint (`/list`, `/detail`, `/update`, `/delete`).
Única excepción: `GET /api/auth/oauth/callback`, la URL de retorno a la que redirige Google, Facebook y
Discord (los proveedores solo redirigen con GET). No guarda datos: reenvía el `code` a la app.

**Formato.** `Content-Type: application/json`, salvo `POST /api/ai/transcribe` (multipart con el audio).

### Autenticación con JWT (access + refresh)

| Token | Qué es | Duración |
|---|---|---|
| `token` (access) | JWT HS256 firmado con `AUTH_SESSION_SECRET`. Lleva `sub` (usuario), `sid` (sesión) y `exp`. | 15 minutos |
| `refreshToken` | Valor aleatorio opaco. En la base solo se guarda su hash SHA-256. | 30 días |

1. `register`, `login` y `oauth/{proveedor}` devuelven `{ user, token, expiresAt, refreshToken, refreshExpiresAt }`.
2. Cada request protegida manda `Authorization: Bearer <token>` (la web usa la cookie `depaso_session`).
3. Cuando el access vence, el servidor responde `401`. El cliente llama a `POST /api/auth/refresh` con el
   `refreshToken` y recibe un par **nuevo**; el refresh anterior queda revocado (rotación), así que usarlo
   dos veces falla. La app móvil hace esto sola y reintenta el pedido.
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

# 3. el access venció (401): renovar
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" -d '{"refreshToken":"x8f..."}'
```

## Autenticación

| Endpoint | Acceso | Schema (body) | Errores |
|---|---|---|---|
| `/api/auth/register` | 🌐 | `registerRequestSchema` — email, password, displayName?, `ageConfirmed18Plus`, `acceptTerms`, `acceptPrivacyNotice`, marketingOptIn? | 400, 409 `EMAIL_ALREADY_REGISTERED`, 429 |
| `/api/auth/login` | 🌐 | `loginRequestSchema` — email, password | 400, 401 `INVALID_CREDENTIALS`, 429 |
| `/api/auth/refresh` | 🌐 | `refreshRequestSchema` — refreshToken | 400, 401 `INVALID_REFRESH_TOKEN` |
| `/api/auth/logout` | 🌐 | — | — |
| `/api/auth/me` | 🔒 | — (devuelve el usuario) | 401 |
| `/api/auth/me/update` | 🔒 | `updateProfileRequestSchema` — displayName?, marketingOptIn? | 400, 401 |
| `/api/auth/account/delete` | 🔒 | — (borra la cuenta y revoca las sesiones) | 401 |
| `/api/auth/forgot-password` | 🌐 | `forgotPasswordRequestSchema` — email | 400, 429, 503 |
| `/api/auth/verify-reset-code` | 🌐 | `verifyResetCodeRequestSchema` — email, código de 8 dígitos | 400, 429 |
| `/api/auth/reset-password` | 🌐 | `resetPasswordRequestSchema` — token o código + nueva contraseña | 400, 429 |
| `/api/auth/providers` | 🌐 | — (qué redes sociales están configuradas) | — |
| `/api/auth/oauth/{google\|facebook\|discord}` | 🌐 | `oauthLoginRequestSchema` — code, redirectUri, codeVerifier (PKCE), consent? | 400, 401, 404, 409, 422, 502, 503 |
| `GET /api/auth/oauth/callback` | 🌐 | query del proveedor (`code`, `state`) → redirige a la app | 400 |

## Listas de compra (CRUD)

| Endpoint | Acceso | Schema / body | Errores |
|---|---|---|---|
| `/api/lists` (crear) | 🔒 | `shoppingListInputSchema` — name | 400, 401 |
| `/api/lists/list` | 🔒 | — | 401 |
| `/api/lists/detail` | 🔒 | `{ id }` | 404 |
| `/api/lists/update` | 🔒 | `{ id, ...shoppingListUpdateSchema }` — name?, archived? (solo el dueño) | 400, 404 |
| `/api/lists/delete` | 🔒 | `{ id }` (solo el dueño) | 404 |
| `/api/lists/[id]/items` (agregar) | 🔒 | `shoppingListItemInputSchema` — productId, quantity, note? | 400, 404 |
| `/api/lists/items/update` | 🔒 | `{ id, itemId, ...shoppingListItemUpdateSchema }` | 400, 404 |
| `/api/lists/items/delete` | 🔒 | `{ id, itemId }` | 404 |
| `/api/lists/[id]/members` (compartir) | 🔒 | `shoppingListShareInputSchema` — email | 400, 404, 429 |
| `/api/lists/members/delete` | 🔒 | `{ id, memberUserId }` | 404 |

## Lugares, preferencias y pagos del usuario

| Endpoint | Acceso | Body |
|---|---|---|
| `/api/places` (crear) · `/list` · `/update` · `/delete` | 🔒 | crear: `userPlaceInputSchema`; update: `{ id, ... }`; delete: `{ id }` |
| `/api/route-contexts` (crear) · `/list` · `/delete` | 🔒 | crear: `routeContextInputSchema`; delete: `{ id }` |
| `/api/preferences/products` (crear) · `/list` · `/delete` | 🔒 | crear: `productPreferenceInputSchema`; delete: `{ productId }` |
| `/api/preferences/stores` (crear) · `/list` · `/delete` | 🔒 | crear: `storePreferenceInputSchema`; delete: `{ id }` |
| `/api/payment-methods/list` · `/update` | 🔒 | update: `{ methods: string[] }` |
| `/api/consents` | 🔒 | `consentRequestSchema` |
| `/api/account/export` | 🔒 | — (descarga todos tus datos) |

## Catálogo, precios y rutas

| Endpoint | Acceso | Body |
|---|---|---|
| `/api/products/search` | 🔒 | `{ q?, type?, brandId? }` |
| `/api/products/facets` | 🔒 | `{ q?, type?, brandId? }` |
| `/api/stores/branches` | 🔒 | — |
| `/api/home/feed` | 🔒 | — (cambios de precio y ofertas de tus listas) |
| `/api/community/feed` | 🔒 | `{ scope }` |
| `/api/price-reports` | 🔒 | `priceReportInputSchema` (reportar un precio) |
| `/api/optimization` | 🔒 | `optimizationRunRequestSchema` (arma el recorrido de una lista) |
| `/api/optimize` | 🌐 | `optimizeRequestSchema` |
| `/api/routes/compute` · `/api/routes/nearby-stores` | 🔒 | `routeComputeRequestSchema` · `nearbyStoresRequestSchema` |
| `/api/geocode` · `/api/geocode/reverse` | 🔒 | dirección → coordenadas y al revés |
| `/api/config/mapbox-token` | 🔒 | — |
| `/api/ai/shopping-parse` | 🔒 | `assistantRequestSchema` — texto libre → lista |
| `/api/ai/transcribe` | 🔒 | multipart: audio |

## Comercio 🏪

| Endpoint | Acceso | Body |
|---|---|---|
| `/api/merchant/requests` (pedir ser comercio) · `/list` | 🔒 | `merchantRequestInputSchema` |
| `/api/merchant/claimable-branches` | 🔒 | `{ q }` |
| `/api/merchant/branch` | 🏪 | — |
| `/api/merchant/prices` (cargar) · `/list` · `/update` · `/delete` | 🏪 | `merchantPriceInputSchema`; list: `{ q?, type?, brandId?, offset? }`; update: `{ id, price, displayName? }`; delete: `{ id }` |
| `/api/merchant/products` | 🏪 | `merchantProductInputSchema` |

## Administración 🛡️

| Endpoint | Body |
|---|---|
| `/api/admin/users` · `/price-reports` · `/optimization-runs` | — (listados) |
| `/api/admin/merchant-requests` | `{ status }` (`PENDING`, `APPROVED`, `REJECTED`) |
| `/api/admin/merchant-requests/[id]` | `merchantDecisionInputSchema` (aprobar o rechazar) |
| `/api/admin/moderation` | `moderationActionInputSchema` |
| `/api/admin/stores` (crear) · `/list` · `/update` · `/delete` | `storeInputSchema`; update/delete llevan `{ id }`. Borrar una cadena con sucursales responde 409 `STORE_HAS_BRANCHES` |
| `/api/admin/store-branches` (crear) · `/list` · `/update` · `/delete` | `storeBranchInputSchema`; list: `{ storeId? }` |
| `/api/admin/prices` (crear) · `/list` · `/update` | `priceInputSchema`; list: `{ productVariantId?, storeBranchId? }` |

## Mantenimiento ⏱️ y salud

| Endpoint | Acceso | Para qué |
|---|---|---|
| `/api/promos/sync` | ⏱️ | Actualiza las promociones bancarias |
| `/api/catalog/refresh` | ⏱️ | Recalcula la popularidad de productos |
| `/api/health` | 🌐 | `{ "ok": true }` si la API llega a la base (503 si no) |
