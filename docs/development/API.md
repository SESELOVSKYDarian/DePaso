# API de DePaso

API REST en `apps/api` (Next.js, *route handlers*). Producción: `https://de-paso-api.vercel.app`.
Local: `http://localhost:3000`. Los tipos de entrada y salida están definidos con Zod en
[`packages/validation/src`](../../packages/validation/src) (fuente de verdad de los campos) y
hay un cliente tipado en [`packages/api-client`](../../packages/api-client/src).

Guía de instalación: [GUIA-DE-INSTALACION.md](../GUIA-DE-INSTALACION.md).

## Convenciones

**Formato.** Todo es JSON (`Content-Type: application/json`), salvo `POST /api/ai/transcribe`
(multipart).

**Autenticación.** Las rutas marcadas 🔒 necesitan sesión. El token llega en
`Authorization: Bearer <token>` (la app móvil) o en la cookie `depaso_session` (web). El token se
obtiene en `login`, `register` y `oauth` y vale **30 días**; se guarda hasheado en la base y se
revoca con `logout`, al cambiar la contraseña o al eliminar la cuenta.

**Roles.** `USER` (por defecto), `MERCHANT` (comercio aprobado por un admin) y `ADMIN`.

| Marca | Quién puede |
|---|---|
| 🔒 | Cualquier usuario con sesión |
| 🏪 | Rol `MERCHANT` |
| 🛡️ | Rol `ADMIN` |
| 🌐 | Público (sin sesión) |

**Errores.** Siempre `{ "error": "CODIGO" }` (y `issues` con el detalle de Zod en 400).

| Código HTTP | Cuándo |
|---|---|
| 400 | `INVALID_REQUEST` (datos inválidos), `INVALID_OR_EXPIRED_TOKEN` |
| 401 | `UNAUTHORIZED` (sin sesión) o `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` (rol insuficiente) |
| 404 | No existe o no es tuyo (se responde 404, no 403, para no revelar recursos ajenos) |
| 409 | Conflicto (`EMAIL_ALREADY_REGISTERED`, `ACCOUNT_NOT_FOUND`) |
| 413 | `AUDIO_TOO_LARGE` |
| 422 | `EMAIL_UNAVAILABLE`, `NOTHING_UNDERSTOOD` |
| 429 | `RATE_LIMITED` (demasiados intentos) |
| 502 | Falló un servicio externo (`OAUTH_FAILED`, `EMAIL_SEND_FAILED`, `TRANSCRIPTION_FAILED`) |
| 503 | Función no configurada (`EMAIL_NOT_CONFIGURED`, `PROVIDER_NOT_CONFIGURED`, `STT_NOT_CONFIGURED`) |

**Límites de uso** (por IP o por cuenta, ventana móvil):

| Ruta | Límite |
|---|---|
| `POST /auth/login` | 10 cada 15 min por IP |
| `POST /auth/register` | 10 por hora por IP |
| `POST /auth/oauth/:provider` | 20 cada 15 min por IP |
| `POST /auth/forgot-password` | 5 por hora por IP |
| `POST /auth/reset-password` | 10 por hora por IP; códigos: 8 intentos cada 30 min por email |
| `POST /auth/verify-reset-code` | 20 por hora por IP; comparte el límite de intentos por email |
| `POST /price-reports` | 10 por hora por cuenta |
| `POST /ai/shopping-parse` y `/ai/transcribe` | 20 cada 10 min por cuenta |

> Todas las rutas empiezan con `/api`. En las tablas se omite ese prefijo.

---

## Salud

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | 🌐 | `{ "ok": true }` si el API llega a la base; si no, 503 con el motivo |

## Autenticación

### Registro e inicio de sesión

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | Crea la cuenta y abre sesión. **201** |
| POST | `/auth/login` | 🌐 | Inicia sesión |
| POST | `/auth/logout` | 🔒 | Revoca la sesión actual |
| GET | `/auth/me` | 🔒 | Datos del usuario actual |
| PATCH | `/auth/me` | 🔒 | Actualiza `displayName` y/o `marketingOptIn` |
| DELETE | `/auth/account` | 🔒 | Elimina (anonimiza) la cuenta y revoca todas sus sesiones |

**`POST /auth/register`**

```json
{
  "email": "ana@correo.com",
  "password": "mínimo 8 caracteres",
  "displayName": "Ana",
  "ageConfirmed18Plus": true,
  "acceptTerms": true,
  "acceptPrivacyNotice": true,
  "marketingOptIn": false
}
```

Los tres `true` son obligatorios (mayoría de edad, términos y privacidad); se guardan como
consentimientos con la versión del documento. Errores: `409 EMAIL_ALREADY_REGISTERED`.

**`POST /auth/login`** → `{ "email", "password" }`. Error genérico `401 INVALID_CREDENTIALS`
(no revela si el email existe).

**Respuesta de ambas (`AuthResponse`)**

```json
{
  "user": { "id": "…", "email": "…", "displayName": "Ana", "marketingOptIn": false,
            "role": "USER", "createdAt": "2026-09-18T19:57:45.916Z" },
  "token": "…",
  "expiresAt": "2026-11-17T19:57:45.916Z"
}
```

### Login social (Google, Meta, Discord)

Flujo *authorization code + PKCE*. Los secretos de cada proveedor viven solo en el servidor.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/auth/providers` | 🌐 | Qué proveedores están activos y su `clientId` público |
| GET | `/auth/oauth/callback` | 🌐 | URL https que se registra en cada proveedor; reenvía `code` y `state` a la app |
| POST | `/auth/oauth/:provider` | 🌐 | `:provider` = `google`, `facebook` (Meta) o `discord`. Canjea el `code` y abre sesión |

**`POST /auth/oauth/:provider`**

```json
{
  "code": "…",
  "redirectUri": "https://<api>/api/auth/oauth/callback",
  "codeVerifier": "…",
  "consent": { "ageConfirmed18Plus": true, "acceptTerms": true,
               "acceptPrivacyNotice": true, "marketingOptIn": false }
}
```

- Si el email (verificado por el proveedor) ya tiene cuenta, inicia sesión. `consent` se ignora.
- Si no existe, **`consent` es obligatorio** y se crea la cuenta (**201**, `isNewAccount: true`).
  Sin él: `409 ACCOUNT_NOT_FOUND`.
- Errores: `404 UNKNOWN_PROVIDER`, `400 INVALID_REDIRECT_URI`, `422 EMAIL_UNAVAILABLE`
  (el proveedor no dio un email verificado), `503 PROVIDER_NOT_CONFIGURED`, `502 OAUTH_FAILED`.

### Recuperar contraseña (3 pasos)

| Paso | Método | Ruta | Descripción |
|---|---|---|---|
| 1 | POST | `/auth/forgot-password` | `{ "email" }`. Manda un mail con un **código de 8 dígitos** y un link de respaldo. Responde igual exista o no la cuenta |
| 2 | POST | `/auth/verify-reset-code` | `{ "email", "code" }`. Confirma el código **sin cambiar nada**. `400 INVALID_OR_EXPIRED_TOKEN` si es incorrecto |
| 3 | POST | `/auth/reset-password` | Cambia la contraseña. Cierra todas las sesiones abiertas |

`POST /auth/reset-password` acepta una de dos formas:

```json
{ "email": "ana@correo.com", "code": "12345678", "password": "nueva-contraseña" }
{ "token": "…del link del mail…", "password": "nueva-contraseña" }
```

El código y el link están ligados a la contraseña actual: **sirven una sola vez** y vencen a los
~20–30 minutos. La página web de respaldo es `GET /reset-password?token=…`.

## Consentimientos y datos personales

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/consents` | 🔒 | `{ "type": "LOCATION" \| "MARKETING", "accepted": true/false }` |
| GET | `/account/export` | 🔒 | Descarga todos los datos de la persona (cuenta, lugares, listas, preferencias, reportes) |

## Lugares y recorridos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/places` | 🔒 | Lugares guardados |
| POST | `/places` | 🔒 | Crea un lugar |
| PATCH | `/places/:id` | 🔒 | Edita un lugar propio |
| DELETE | `/places/:id` | 🔒 | Borra un lugar propio |
| GET | `/route-contexts` | 🔒 | Recorridos guardados |
| POST | `/route-contexts` | 🔒 | `{ "name", "waypointPlaceIds": [1 a 6 ids] }` |
| DELETE | `/route-contexts/:id` | 🔒 | Borra un recorrido propio |

**Lugar:** `{ name, type: HOME|WORK|STUDY|GYM|FAMILY|CUSTOM, address, latitude, longitude, isFavorite }`.

## Listas de compras

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/lists` | 🔒 | Listas propias y compartidas conmigo (con `itemCount`, `memberCount` y `role` OWNER/MEMBER) |
| POST | `/lists` | 🔒 | `{ "name" }` (1–80 caracteres) |
| GET | `/lists/:id` | 🔒 | Detalle con productos, miembros y `role` |
| PATCH | `/lists/:id` | 🔒 | `{ "name"?, "archived"? }` |
| DELETE | `/lists/:id` | 🔒 | Solo el dueño |
| POST | `/lists/:id/items` | 🔒 | `{ "productId", "quantity"?: 1–99, "note"?: ≤140 }` |
| PATCH | `/lists/:id/items/:itemId` | 🔒 | `{ "quantity"?, "note"? }` |
| DELETE | `/lists/:id/items/:itemId` | 🔒 | Quita un producto |
| POST | `/lists/:id/members` | 🔒 | `{ "email" }`: comparte con alguien que ya tiene cuenta. Errores: `USER_NOT_FOUND`, `CANNOT_SHARE_WITH_SELF` |
| DELETE | `/lists/:id/members/:memberUserId` | 🔒 | El dueño quita a alguien; cada miembro puede salirse |

Los productos de una lista vienen con `productName`, `brandName`, `imageUrl`, `category`,
`quantity` y `note`.

## Catálogo de productos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/products/search?q=&type=&brandId=` | 🔒 | Búsqueda ordenada por relevancia. Alcanza con uno de los tres criterios |
| GET | `/products/facets?q=&type=&brandId=` | 🔒 | Opciones de filtro con cantidades: `{ types: [{id,label,count}], brands: [{id,name,count}] }` |

**Orden de la búsqueda:** nombre exacto → empieza con la palabra → la palabra entera dentro del
nombre → parte de otra palabra → solo coincide por la marca. Dentro de cada grupo, primero los
que más comercios publican y, a igualdad, el nombre más corto. Cada resultado trae `name`,
`brandName`, `imageUrl` (foto de Open Food Facts si existe) y `variants` (`unit`, `unitSize`).

`type` es un id de tipo derivado del nombre (`gaseosa`, `vino`, `shampoo`…); la lista completa y
sus etiquetas está en [`packages/domain/src/productTypes.ts`](../../packages/domain/src/productTypes.ts).

## Preferencias y medios de pago

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET / POST | `/preferences/products` | 🔒 | Preferencia de marca: `{ productId, type: EXACT\|PREFERRED\|ANY, preferredBrandId? }` |
| DELETE | `/preferences/products/:productId` | 🔒 | Quita la preferencia |
| GET / POST | `/preferences/stores` | 🔒 | Preferencia de comercio: `{ category, type: REQUIRED\|PREFERRED, storeBranchId }` |
| DELETE | `/preferences/stores/:id` | 🔒 | Quita la preferencia |
| GET | `/payment-methods` | 🔒 | `{ "methods": ["cuenta-dni", …] }` |
| PUT | `/payment-methods` | 🔒 | Reemplaza la selección: `{ "methods": [slugs] }` |
| GET / POST | `/promos/sync` | 🛡️ o cron | Sincroniza promos de bancos y billeteras. El cron de Vercel lo llama a diario con `Authorization: Bearer $CRON_SECRET` |

## Comercios, mapas y rutas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/stores/branches` | 🔒 | Sucursales activas |
| POST | `/geocode` | 🔒 | `{ "address" }` → `{ latitude, longitude }` (503 sin Mapbox) |
| POST | `/geocode/reverse` | 🔒 | `{ latitude, longitude }` → `{ address }` |
| POST | `/routes/compute` | 🔒 | `{ waypoints: [2 a 6 puntos], transportMode }` → `{ distanceMeters, durationSeconds, polyline }`. `transportMode`: CAR, MOTORCYCLE, BICYCLE, WALK, PUBLIC_TRANSPORT |
| GET | `/config/mapbox-token` | 🔒 | Token público de Mapbox para dibujar el mapa |

## Optimización de compra (Top 3)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/optimization` | 🔒 | `{ shoppingListId, routeContext: { waypoints }, transportMode }`. Carga la lista, los precios vigentes y las preferencias del usuario, aplica promos de sus medios de pago y devuelve hasta 3 planes (`BALANCED`, `FASTEST`, `CHEAPEST`) con paradas, total, desvío y ahorro estimado. `NO_CURRENT_PRICES` si no hay precios |
| POST | `/optimize` | 🌐 | Motor puro: recibe todo el contexto en el cuerpo (útil para pruebas) |

## Comunidad

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/price-reports` | 🔒 | Reporta un precio: `{ productVariantId, storeBranchId, reportedPrice, requiresPromotion, promotionNote?, goodFaithDeclared: true }`. **201** `{ id, createdAt, status: "RECEIVED" }`. No pisa el precio: pasa por consenso y moderación |
| GET | `/community/feed?scope=community\|mine` | 🔒 | `community`: reportes de los últimos 14 días, anónimos y sin ocultar por moderación. `mine`: los propios, con `status` VISIBLE/HIDDEN |

## Asistente de compras con IA

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/ai/transcribe` | 🔒 | Multipart, campo `file` (audio, hasta 4 MB). Devuelve `{ "text" }`. El audio no se guarda. `503 STT_NOT_CONFIGURED` sin clave de voz |
| POST | `/ai/shopping-parse` | 🔒 | `{ "text" }` (hasta 800 caracteres). Separa el pedido en productos y devuelve, por cada uno, `term`, `quantity`, `typeId`, las `brands` más comunes y los `candidates` del catálogo. `source` indica si lo interpretó la IA (`ai`) o el corte simple por comas (`fallback`) |

## Comercio (rol MERCHANT)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/merchant/requests` | 🔒 | Mi solicitud para ser comercio |
| POST | `/merchant/requests` | 🔒 | `{ businessName, address, latitude, longitude, phone?, note? }` |
| GET | `/merchant/branch` | 🏪 | Mi sucursal |
| GET / POST | `/merchant/prices` | 🏪 | Mis precios / publica o actualiza el precio de un producto del catálogo |
| PATCH / DELETE | `/merchant/prices/:id` | 🏪 | Edita o da de baja un precio propio |
| POST | `/merchant/products` | 🏪 | Crea un producto nuevo y lo publica con su precio |

## Administración (rol ADMIN)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/merchant-requests?status=` | Solicitudes de comercio (por defecto PENDING) con el contador |
| POST | `/admin/merchant-requests/:id` | `{ decision: APPROVE\|REJECT, reason? }` (el motivo es obligatorio al rechazar). Aprobar crea el comercio y pasa al usuario a `MERCHANT` |
| GET | `/admin/users` | Usuarios con su rol y puntaje de confianza |
| GET | `/admin/price-reports` | Reportes de precio con sus eventos de moderación |
| POST | `/admin/moderation` | `{ targetPriceReportId, type, reason }`. `type`: REPORT_HIDDEN, REPORT_WEIGHTED_DOWN, REPORT_REJECTED, USER_SUSPENDED |
| GET | `/admin/optimization-runs` | Historial de optimizaciones |
| GET / POST | `/admin/stores` · PATCH / DELETE `/admin/stores/:id` | ABM de comercios (bandera) |
| GET / POST | `/admin/store-branches` · PATCH / DELETE `/admin/store-branches/:id` | ABM de sucursales |
| GET / POST | `/admin/prices` · PATCH `/admin/prices/:id` | Carga y corrección manual de precios |

## Ejemplo completo

```bash
# 1. Iniciar sesión
curl -s -X POST https://de-paso-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@correo.com","password":"mi-contraseña"}'
# → { "user": {…}, "token": "abc…", "expiresAt": "…" }

# 2. Crear una lista y buscar un producto
curl -s -X POST https://de-paso-api.vercel.app/api/lists \
  -H "Authorization: Bearer abc…" -H "Content-Type: application/json" \
  -d '{"name":"Compra semanal"}'

curl -s "https://de-paso-api.vercel.app/api/products/search?q=arroz&type=arroz" \
  -H "Authorization: Bearer abc…"
```
