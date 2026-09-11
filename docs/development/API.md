# API

`apps/api` — Next.js route handlers. Presentación fina: valida con Zod
(`@depaso/validation`), llama al dominio/motor, devuelve JSON. Sin lógica de negocio en el
handler (regla 8 del master prompt) y sin confiar en datos sensibles enviados por el
cliente sin validar (sección 81 — `userId`, `role`, `price`, `trust score` nunca se toman
del body sin revalidar contra la sesión/DB del lado servidor, una vez que exista auth).

## Endpoints implementados en este pase

### `POST /api/optimize`

Prueba end-to-end del motor de optimización sin depender de la base de datos — recibe los
candidatos de comercio/precio directamente en el body (en producción, Fase 15+, esto se
resuelve consultando `@depaso/database` por corredor de ruta en vez de recibirlos crudos).

**Request** (validado por `optimizeRequestSchema`, ver
`packages/validation/src/optimize.ts`):

```jsonc
{
  "shoppingList": { "items": [{ "productId": "leche", "productName": "Leche", "quantity": 1 }] },
  "routeContext": { "waypoints": [{ "latitude": -38.0, "longitude": -57.55 }, { "latitude": -37.9, "longitude": -57.55 }] },
  "preferences": { "productPreferences": [], "storePreferences": [] },
  "storeCandidates": [
    {
      "storeBranchId": "store-1",
      "storeName": "Carrefour",
      "branchName": "Constitución",
      "location": { "latitude": -37.95, "longitude": -57.54 },
      "offers": [{ "productId": "leche", "brandId": null, "price": 1200, "confidence": "HIGH" }]
    }
  ],
  "transportMode": "CAR",
  "mode": "BALANCED"
}
```

**Response 200:**

```jsonc
{ "plans": [ /* OptimizationPlanResult[] — ver packages/optimization/src/types.ts */ ] }
```

**Errores:**

- `400 INVALID_REQUEST` — body no cumple el schema (detalle en `issues`, formato Zod).
- `422 OPTIMIZATION_FAILED` — el motor tiró una excepción (ej. menos de 2 waypoints).

### Auth (Fase 4)

Implementación de referencia: hash propio (`scrypt`, `apps/api/lib/auth/password.ts`) +
sesión propia sobre Prisma (`apps/api/lib/auth/session.ts`), detrás de la interfaz
`AuthProvider` de `@depaso/domain` — ver `docs/development/DECISIONS.md`. El token viaja
como cookie httpOnly (`depaso_session`, web) **o** header `Authorization: Bearer <token>`
(mobile, sin cookies de navegador). Rate limit en memoria por IP en `register`/`login`
(`apps/api/lib/auth/rateLimit.ts` — MVP, no distribuido, ver su propio comentario).

**Código escrito y typechequeado, probado con Vitest donde no depende de DB
(`password.test.ts`, `rateLimit.test.ts` — 8 tests). El flujo completo contra una base
real NO se probó end-to-end — no hay Postgres vivo en este entorno (ver `PROGRESS.md`).**
Se confirmó que el route handler compila y ejecuta hasta el punto exacto de la conexión a
la base (error de conexión real, no un bug de código) — ver `PROGRESS.md`, sesión del
`2026-09-11` (Fase 4).

#### `POST /api/auth/register`

Body (`registerRequestSchema`): `email`, `password` (≥8 caracteres), `displayName?`,
`ageConfirmed18Plus: true` (obligatorio, declaración 18+), `acceptTerms: true`
(obligatorio), `acceptPrivacyNotice: true` (obligatorio), `marketingOptIn` (opcional,
default `false`). Crea `User` + `UserProfile` + 3 `UserConsent` (TERMS/PRIVACY/MARKETING)
en una transacción — evidencia de aceptación obligatoria (FUNCTIONAL.md). Responde `201`
con `{ user, token, expiresAt }` y setea la cookie de sesión.

Errores: `400 INVALID_REQUEST`, `409 EMAIL_ALREADY_REGISTERED`, `429 RATE_LIMITED`.

#### `POST /api/auth/login`

Body (`loginRequestSchema`): `email`, `password`. Mismo error genérico
(`401 INVALID_CREDENTIALS`) para email inexistente, cuenta eliminada o password incorrecta
— no revela cuáles emails existen (sección 81). `200` con `{ user, token, expiresAt }`.

#### `POST /api/auth/logout`

Revoca la sesión activa (token de cookie o header) y limpia la cookie. `200 { ok: true }`
siempre, incluso sin sesión activa (logout es idempotente).

#### `GET /api/auth/me`

Requiere sesión. `200` con el usuario actual (`AuthUserResponse` — nunca incluye
`passwordHash`). `401 UNAUTHORIZED` sin sesión válida.

#### `PATCH /api/auth/me`

Requiere sesión. Body (`updateProfileRequestSchema`): `displayName?`, `marketingOptIn?`.
Cambiar `marketingOptIn` registra un nuevo `UserConsent` (trazabilidad).

#### `DELETE /api/auth/account`

Requiere sesión. Elimina la cuenta (sección 10; derecho del titular obligatorio,
LEGAL.md): borrado lógico (`deletedAt`), email anonimizado
(`deleted-<userId>@depaso.invalid`, libera el email original para reuso), revoca todas las
sesiones. Reportes de precio comunitarios quedan desidentificados, no se borran (regla de
retención de LEGAL.md).

#### `POST /api/consents` (Fase 5)

Requiere sesión. Body (`consentRequestSchema`): `type` (`LOCATION` | `MARKETING`),
`accepted`. Consentimientos posteriores al registro — hoy sólo lo usa el modal de permiso
de ubicación de `apps/mobile` (sección 30-31: "Permitir mientras uso DePaso" es un
consentimiento separado del de T&C/Privacidad, se pide recién en el primer uso de
ubicación, no en el registro). `200 { ok: true }`. `401 UNAUTHORIZED` sin sesión.

### Lugares guardados (Fase 6)

CRUD completo sobre `UserPlace` (sección 6/32). `userId` sale siempre de la sesión, nunca
del body/URL — un `PATCH`/`DELETE` con el `id` de un lugar ajeno responde `404`, no `403`
(no confirma que el recurso existe si no es tuyo).

#### `GET /api/places`

Requiere sesión. `200 { places: UserPlaceResponse[] }`, ordenados por favorito primero.

#### `POST /api/places`

Requiere sesión. Body: `userPlaceInputSchema` (`name`, `type`, `address`, `latitude`,
`longitude`, `isFavorite?`). `201` con el lugar creado.

#### `PATCH /api/places/:id`

Requiere sesión. Body: `userPlaceUpdateSchema` (todos los campos opcionales). `200` con el
lugar actualizado, `404` si no existe o no es tuyo.

#### `DELETE /api/places/:id`

Requiere sesión. `200 { ok: true }`, `404` si no existe o no es tuyo.

**Nota de geocoding:** estos endpoints reciben `latitude`/`longitude` ya resueltos — no
geocodifican direcciones del lado del servidor. `apps/mobile` resuelve la dirección a
coordenadas con el geocoder nativo del sistema operativo (`expo-location`,
`Location.geocodeAsync`), sin depender de una API paga de mapas (sección 67 — mismo
criterio que `MockRouteProvider`).

### Contextos de ruta guardados (Fase 7)

`SavedRouteContext` — presets con nombre de "¿Por dónde vas a andar hoy?" (sección 34:
"Guardado hasta que el usuario lo borre"). `waypointPlaceIds` sólo puede referenciar
`UserPlace` del usuario actual — se valida contra la DB antes de guardar.

#### `GET /api/route-contexts`

Requiere sesión. `200 { routeContexts: RouteContextResponse[] }`, más reciente primero.

#### `POST /api/route-contexts`

Requiere sesión. Body: `routeContextInputSchema` (`name`, `waypointPlaceIds: string[]`,
1-6). `400 INVALID_PLACE_IDS` si algún id no es un `UserPlace` del usuario. `201` con el
contexto creado.

#### `DELETE /api/route-contexts/:id`

Requiere sesión. `200 { ok: true }`, `404` si no existe o no es tuyo.

**Nota de diseño:** el recorrido de **hoy** (lugares temporales + presets cargados) vive
sólo en el cliente (`apps/mobile/lib/routeContext/TodayRouteContext.tsx`) — nunca se
persiste automáticamente acá. Sólo se crea un `SavedRouteContext` si el usuario elige
explícitamente "Guardar este recorrido" (sección 31: nunca guardar algo temporal sin
acción explícita).

**Pendiente, deliberadamente no implementado en este pase:** recuperación de contraseña —
necesita un proveedor de email, que es `NO DEFINIDO` en `docs/legal-functional/LEGAL.md`
(tabla de terceros). Implementarlo sin proveedor real significaría inventar un servicio
externo — se deja pendiente hasta que haya una decisión de proveedor (Resend, SES, u otro).

## Endpoints pendientes (por fase — ver IMPLEMENTATION-PLAN.md)

`UserPlace` CRUD, `ShoppingList`/`ShoppingListItem` CRUD, `ProductPreference`/
`StorePreference` CRUD, búsqueda de productos, `PriceReport` (reportar precio), endpoints
de admin (moderación, precios disputados) — dependen de una base Postgres viva para
probarse de verdad (ver `PROGRESS.md`, bloqueantes de infraestructura); el código de auth
que los habilita (sesión, `getCurrentUser`) ya está listo para que los consuman.

## Convenciones para cuando se agreguen más endpoints

- Un route handler por recurso/acción, delegando a `@depaso/domain`/`@depaso/database` —
  nunca lógica de negocio inline en `route.ts`.
- Todo input se valida con un schema Zod en `@depaso/validation` antes de tocar el dominio.
- Nunca devolver el `trust score` exacto de un usuario en una respuesta pública
  (BUSINESS-RULES.md p.7).
- Todo precio en una respuesta lleva fuente, sucursal, fecha de actualización y confianza
  — nunca sólo el monto (FUNCTIONAL.md, "Requisitos de la ficha de precio").
