# Decisiones técnicas

Formato por entrada: Contexto / Alternativas / Decisión / Motivo / Consecuencias (sección
97 del master prompt). Decisiones de producto/marca/legal ya tomadas están en
`docs/brand-product/DECISIONS.md` y no se repiten acá — esto es sólo lo técnico.

---

## 2026-09-11 — Monorepo: pnpm + Turborepo

**Contexto:** repo vacío (sólo docs/branding/pdf), sin código. Master prompt pide
mobile+web+admin+api+packages compartidos.

**Alternativas:** Nx, Turborepo, ningún tool (workspaces pnpm solos).

**Decisión:** pnpm workspaces + Turborepo.

**Motivo:** confirmado explícitamente por el usuario en el prompt de build. Turborepo es
liviano, sin servidor propio, buen soporte para Next.js/Expo en el mismo repo.

**Consecuencias:** cache de tareas por `turbo.json`; cada package declara sus propios
scripts (`typecheck`/`test`/`build`/`lint`) y Turborepo los orquesta con dependencias
(`^build` antes de `typecheck`, etc.).

---

## 2026-09-11 — Auth propia sobre Prisma, no Supabase

**Contexto:** el master prompt pide reusar Supabase Auth si existe, o elegir una solución
compatible si no. No hay credenciales de Supabase ni de ningún proveedor en este entorno.

**Alternativas:** Supabase Auth (requiere cuenta/credenciales que no existen), Auth.js/
NextAuth, auth propia (password hash + sesión) sobre el mismo Postgres/Prisma que el resto
del dominio.

**Decisión:** auth propia sobre Prisma/Postgres, aislada detrás de la interfaz
`AuthProvider` en `@depaso/domain` (`hashPassword`/`verifyPassword`/`createSession`/
`verifySession`/`revokeSession`).

**Motivo:** no requiere credenciales ni cuentas externas que no existen (evita bloquear el
avance por un servicio pago/externo — criterio de autonomía, sección 102). Al estar detrás
de una interfaz, cambiar a Supabase Auth (u otro proveedor) más adelante es un cambio
acotado a la implementación, no al resto del backend.

**Consecuencias:** la implementación concreta de `AuthProvider` (Fase 4, pendiente) va en
`apps/api`. Hasta que exista, no hay registro/login real — sólo el contrato definido.

---

## 2026-09-11 — Postgres local vía `docker-compose.yml`, sin migración corrida

**Contexto:** el motor de datos elegido es Postgres + Prisma. Esta máquina no tiene Docker
instalado (`docker -v` → command not found).

**Alternativas:** SQLite para dev (cambia el dialecto y hay que migrar después), pedir al
usuario que instale Docker antes de seguir, o entregar el schema + `docker-compose.yml` de
referencia sin correr la migración en este pase.

**Decisión:** se entrega `schema.prisma` completo y `docker-compose.yml` (Postgres 16), sin
correr `prisma migrate dev` en este pase. Verificación limitada a `prisma validate` /
`prisma generate`.

**Motivo:** usar SQLite generaría divergencia de tipos (`Decimal`, arrays, enums) que
tendría que revertirse; instalar Docker no es una acción que se pueda tomar por el usuario
sin su intervención. Entregar el schema sin migrar es reversible y no bloquea el resto del
trabajo (el motor de optimización no depende de una DB viva).

**Consecuencias:** ver `docs/development/PROGRESS.md` — correr Postgres local (o apuntar
`DATABASE_URL` a un Postgres gestionado) y `prisma migrate dev` es un paso manual
pendiente antes de la Fase 4 (Auth) y siguientes.

---

## 2026-09-11 — `MockRouteProvider` en vez de un proveedor de mapas real

**Contexto:** sección 67 del master prompt: sin API keys, crear `MockRouteProvider` y
seguir. No hay keys de Google Maps Routes ni Mapbox en este entorno.

**Decisión:** `createMockRouteProvider()` en `@depaso/optimization` calcula distancia como
suma de tramos en línea recta (Haversine) entre waypoints consecutivos, y tiempo como
`distancia / velocidad_promedio_por_modo_de_transporte`.

**Motivo:** permite implementar y testear el motor de optimización completo (la pieza más
importante de este pase) sin depender de un servicio pago externo.

**Consecuencias:** las distancias/tiempos no reflejan calles reales — son una
aproximación razonable para desarrollo y tests, no para producción. `RouteProvider` es una
interfaz (`@depaso/domain`); reemplazar el mock por Google Routes/Mapbox es una
implementación nueva de esa interfaz, sin tocar `optimize.ts`, `deviation.ts` ni
`combinations.ts`.

---

## 2026-09-11 — Resolución del token de color de fondo (`surface.base` vs `brand.cream`)

**Contexto:** `docs/brand-product/BRAND.md` (fuente PDF, p.12) define
`Surface/Niebla #F7FAF8` como fondo de aplicación. `branding/DePaso_Tipografia_Logo.md` y
el master prompt listan además `Cream #F1FFE2` dentro de la paleta del logo, sin aclarar
si reemplaza al fondo documentado en el PDF.

**Alternativas:** (a) usar `#F1FFE2` como fondo de toda la app, (b) usar `#F7FAF8` como
fondo y tratar `#F1FFE2` como un tono de marca aparte, (c) volver a abrir el PDF para
verificar.

**Decisión:** (b) — `colors.surface.base = #F7FAF8` (fondo de app), `colors.brand.cream =
#F1FFE2` (acento de marca/logo, uso puntual, no fondo de UI).

**Motivo:** `BRAND.md` es la interpretación directa del PDF (fuente autoritativa según
`CLAUDE.md` del proyecto) y define explícitamente `#F7FAF8` como "fondo de aplicación";
`#F1FFE2` aparece sólo en la paleta del logo/branding, sin esa etiqueta. No hay
contradicción real — son dos tokens con propósitos distintos, no dos valores para el mismo
propósito — así que no ameritó volver a abrir el PDF (regla de `CLAUDE.md`: releer el PDF
sólo ante contradicción real, información faltante, o verificación visual/legal exacta).

**Consecuencias:** ninguna pantalla debe usar `#F1FFE2` como fondo general; queda
disponible como `colors.brand.cream` para piezas de marca puntuales (ej. un chip, un
fondo de card especial), nunca como reemplazo de `surface.base`.

---

## 2026-09-11 — Modelo de score del motor de optimización

**Contexto:** sección 61 del master prompt prohíbe sumar $ + km + minutos directamente.
Sección 60 pide pesos configurables por modo (BALANCED/CHEAPEST/FASTEST). Sección 87 da 5
casos de test concretos que el resultado debe cumplir.

**Decisión:** cada plan se descompone en 5 dimensiones normalizadas 0..1 (`monetaryNorm`,
`routeNorm`, `convenienceNorm`, `preferenceNorm`, `confidenceNorm`) más una penalización
dura no configurable por productos faltantes, combinadas con pesos por perfil que suman
1.0. El desvío de ruta se normaliza con una escala suave
`d / (d + REFERENCE)` (`REFERENCE = 4500m`) en vez de dividir por el máximo del set de
candidatos del día.

**Motivo:** normalizar el desvío contra el máximo del propio set de candidatos es
inestable — el mismo desvío absoluto (ej. 1.5 km) puntúa distinto según qué otros
comercios existan ese día. La escala fija fue calibrada a mano para que los Casos A y B de
la sección 87 (+10km vs +300m; $8.000 de ahorro con +1km) den el resultado narrado en el
master prompt — ver `packages/optimization/src/scoring.ts` para el detalle numérico. El
peso de la penalización por producto faltante (2.0) se eligió para que, sumando los pesos
de las 5 dimensiones (máximo 1.0), ningún plan incompleto le gane a uno completo sólo por
parecer "barato" (un carrito vacío no es la compra más barata).

**Consecuencias:** estos valores son heurísticas de arranque, no una fórmula cerrada — la
propia documentación de producto dice explícitamente que no hay "umbral exacto de desvío
que compensa" (`docs/brand-product/PRODUCT.md`, NO DEFINIDO). Se recalibran con datos
reales de Mar del Plata cuando existan (Fase 15+). El score numérico interno
(`debugScore`) nunca se expone al usuario — sección 66, "no mostrar Score 0.376 como
explicación".

---

## 2026-09-11 — Expo SDK 54 en vez de SDK 57 (última) en `apps/mobile`

**Contexto:** al bootstrapear `apps/mobile` se instaló inicialmente la última versión
publicada de Expo (SDK 57 / `expo@57.0.22`) con `react-native@0.87.1` y
`react-native-reanimated@4.6.0`. Esa combinación resultó estar rota: `expo-modules-core`
(fijado por SDK 57) declara un peer de `react-native-worklets` más viejo que el que
`reanimated@4.6.0` realmente necesita, y en la práctica eso rompía los tipos de
`style={...}` en **toda** la app (cualquier `<Text>`/`<View>` con estilos vía
`StyleSheet.create` fallaba el typecheck con errores de tipos de `Animated` sin sentido).

**Alternativas:** (a) forzar versiones de `react-native-worklets` a mano hasta que
typecheckeara, (b) esperar a que Expo publique un patch que alinee los peers, (c) bajar
todo el stack a una combinación de SDK más establecida.

**Decisión:** (c) — Expo SDK 54 (`expo@54.0.37`, `react-native@0.81.5`,
`react-native-reanimated@4.1.7` + `react-native-worklets@0.8.3`, `expo-router@6.0.24`),
resuelto corriendo `npx expo install <paquetes>` para que la propia CLI de Expo calculara
las versiones exactas compatibles, en vez de pinearlas a mano paquete por paquete.

**Motivo:** SDK 57 es la versión "latest" publicada, pero recién salida — su cadena de
compatibilidad con Reanimated 4.6/worklets 0.12 todavía no está estable. No hay forma de
probar en un dispositivo/emulador real en este entorno (sin Android Studio/Xcode), así que
apostar por la versión más nueva sin poder verificarla en runtime es innecesariamente
arriesgado. SDK 54 es una combinación con meses de uso real.

**Consecuencias:** `apps/mobile` queda uno o dos SDKs de Expo por detrás de "latest" —
correr `npx expo install --check` / `npx expo-doctor` periódicamente para saber cuándo
conviene subir de SDK, idealmente cuando se pueda probar en un dispositivo/emulador real
antes de confiar en la versión nueva.

---

## 2026-09-11 — `react-native-web` agregado sólo como herramienta de desarrollo

**Contexto:** no hay Android Studio/Xcode en este entorno, así que `apps/mobile` nunca se
había visto correr — sólo typechequeado. El usuario pidió ver la app funcionando.

**Alternativas:** (a) no agregar nada y sólo dar instrucciones para que el usuario corra
la app en su propia máquina, (b) agregar `react-native-web` + `react-dom` para poder usar
`expo start --web` y mostrar la app real en un navegador.

**Decisión:** (b). Se agregó `react-native-web`/`react-dom` a `apps/mobile` y se corrió
`npx expo start --web`, confirmando visualmente onboarding/login/registro/legal
funcionando de verdad (capturas reales, no descripciones).

**Motivo:** es la única forma honesta de mostrar la app mobile corriendo en este entorno
sin inventar un resultado. Expo Web es una herramienta de desarrollo oficial de Expo, no
un hack — corre el mismo código fuente, sin mocks.

**Consecuencias:** `expo-secure-store` no tiene equivalente en navegador — se le agregó un
fallback a `localStorage` sólo cuando `Platform.OS === "web"`
(`apps/mobile/lib/auth/secureStore.ts`); la build nativa real sigue usando `SecureStore`
siempre. Esto **no** reemplaza probar en un dispositivo/emulador real (gestos táctiles,
haptics, tamaños de pantalla reales, `expo-secure-store` nativo) — sección 91 del master
prompt sigue vigente: la web no es el producto principal, esto es sólo una herramienta de
verificación para este entorno de desarrollo puntual.

---

## 2026-09-11 — Botones de Google/Apple sin OAuth real conectado

**Contexto:** el usuario pidió rediseñar login/registro con opciones "Continuar con
Google" / "Continuar con Apple" además del flujo de email existente, tomando una imagen
de referencia visual. El master prompt (sección 10) ya preveía esto: "preparar
arquitectura para Google, Apple posteriormente".

**Alternativas:** (a) no mostrar los botones hasta tener credenciales reales, (b) mostrar
los botones con el diseño pedido pero sin conectar ningún flujo OAuth real.

**Decisión:** (b) — `SocialButton` (`apps/mobile/components/SocialButton.tsx`) tiene el
diseño completo; al tocarlo muestra un toast explicando que falta configurar credenciales,
en vez de simular un login o fallar en silencio.

**Motivo:** implementar Google/Apple Sign-In de verdad requiere credenciales externas que
no existen en este entorno — un client ID de Google Cloud Console, y para Apple una
cuenta de Apple Developer Program (de pago, US$99/año) más configuración de capability en
Xcode (que tampoco está disponible acá). Es exactamente el tipo de decisión que amerita
preguntar antes de avanzar (regla 102: servicio externo pago o credenciales inexistentes)
— se resuelve dejando la UI lista y la integración real pendiente de que el usuario
consiga esas credenciales, en vez de bloquear todo el rediseño por esto.

**Consecuencias:** cuando haya credenciales reales, conectar Google/Apple es sólo
implementar el flujo OAuth detrás de `onPress` de cada `SocialButton` y un método nuevo en
`AuthProvider` (`apps/domain`) — el diseño y la UX ya están terminados, no hace falta
retocar pantallas.

---

## 2026-09-11 — Postgres local vía instalación nativa (winget), no Docker

**Contexto:** ni esta máquina ni la sesión anterior tenían Docker instalado. El usuario
pidió que se resolviera igual, sin depender de que él instale algo primero.

**Decisión:** se instaló PostgreSQL 17 nativo vía `winget install PostgreSQL.PostgreSQL.17`
en vez de Docker.

**Hallazgo importante en el camino:** la instalación de winget detectó un PostgreSQL 17 **ya
instalado desde el 26/12/2024** en esta máquina, con otras bases de datos del usuario
(`ecommerce`, `gammadb`, `malharro`, `mg_arg`, `netflix`, `tablero`, `tecnicacinco`,
`vase_business`, `noctua`) — no se tocó ninguna de ellas. Como no se conocía la contraseña
de ese `postgres` preexistente, **no se intentó resetearla editando `pg_hba.conf`** (esa
acción fue bloqueada por la política de permisos del entorno, correctamente — es un
cambio de configuración de sistema). Se le preguntó al usuario la contraseña en vez de
forzar nada.

**Con la contraseña real:** se creó un rol `depaso` (login + `CREATEDB`, necesario para
que `prisma migrate dev` pueda crear su shadow database) y una base `depaso`, aislados de
todo lo demás. `packages/database/.env` (gitignored) apunta ahí con
`postgresql://depaso:depaso@localhost:5432/depaso`, el mismo valor que ya estaba
documentado en `.env.example`/`docker-compose.yml` — ningún otro archivo necesitó
cambiar.

**Consecuencias:** este Postgres es específico de esta máquina de desarrollo — en otra
máquina/CI seguirá siendo válido `docker compose up -d` con el `docker-compose.yml` del
repo (Postgres en un contenedor limpio, sin este historial). No se documentan acá
credenciales de las otras bases de datos del usuario — son de otros proyectos, fuera del
alcance de DePaso.

---

## 2026-09-11 — `git init` sin commit

**Contexto:** el directorio no era un repositorio git.

**Decisión:** se corrió `git init`; no se creó ningún commit.

**Motivo:** tener control de versiones es estándar para un monorepo de este tamaño y es
reversible/sin costo. Crear commits sin que el usuario lo pida explícitamente viola la
política de commits de este entorno (CLAUDE.md global del usuario / instrucciones del
sistema).

**Consecuencias:** el usuario decide cuándo y qué commitear.

---

## 2026-09-13 — `apps/admin` con `role: ADMIN` + sesión reusada, sin MFA

**Contexto:** Fase 11/12 (comercios/sucursales/precios) necesitan un panel admin con auth
real — hasta acá `apps/admin` era sólo un scaffold. `docs/legal-functional/LEGAL.md` (p.97)
pide explícitamente "MFA para administradores", pero no hay proveedor de MFA elegido ni
decisión de producto sobre cuál (NO DEFINIDO).

**Alternativas:** (a) no tocar `apps/admin` hasta que exista una decisión de MFA, (b)
construir un sistema de roles/RBAC completo con MFA simulado, (c) agregar sólo
`role: "ADMIN"` sobre la misma sesión de usuario ya existente (`Session`/`AuthProvider` de
Fase 4), con el gate server-side (`requireAdmin`) y documentar la brecha de MFA.

**Decisión:** (c). `User.role` (`USER`/`ADMIN`, default `USER`) + `requireAdmin()` en
`apps/api/lib/auth/requireAdmin.ts` (reusa `getCurrentUser`, sólo agrega el chequeo de
rol) + `packages/database/scripts/promote-admin.mjs` para promover una cuenta a mano (no
hay alta de admin autoservicio).

**Motivo:** (a) bloquea Fase 11/12 completas sin necesidad — el admin CRUD en sí no
depende de la decisión de MFA, sólo la política de quién puede *ser* admin en producción.
(b) sería simular una MFA real, lo cual es peor que no tenerla (falsa sensación de
seguridad). (c) deja el control de acceso real (server-side, cada endpoint de
`/api/admin/*` revalida el rol) funcionando hoy, con la brecha de MFA explícita en vez de
oculta — mismo criterio que la recuperación de contraseña pendiente en Fase 4.

**Consecuencias:** **no usar `apps/admin` con datos de producción reales hasta resolver
MFA** (aviso repetido en la pantalla de login). Cuando exista una decisión de proveedor de
MFA, se agrega como un paso extra en el flujo de login de `apps/admin`, sin tocar el modelo
de datos (`role` ya está). El login de `apps/admin` reusa `/api/auth/login` — no hay
endpoint de auth separado para admins.

---

## 2026-09-13 — CORS en `apps/api` por reflejo de `Origin`, sin allowlist fija

**Contexto:** `apps/admin` corre en `localhost:3100` y llama a `apps/api` en
`localhost:3000` desde el navegador — a diferencia de `apps/mobile` (React Native `fetch`
no aplica CORS), esto sí lo necesita. Sin CORS, todo `POST`/`PATCH`/`DELETE` fallaba en el
navegador con `net::ERR_FAILED` aunque el servidor respondiera bien (confirmado con
`read_network_requests` durante la verificación de Fase 11/12: el `OPTIONS` preflight
pasaba, el `POST` real nunca llegaba a loguearse en `apps/api`).

**Alternativas:** (a) allowlist fija de orígenes (`localhost:3100`, `localhost:3002`,
etc.), (b) reflejar el `Origin` de cada request (cualquier origen, con
`Access-Control-Allow-Credentials: true`).

**Decisión:** (b) — `apps/api/middleware.ts`, matcher `/api/:path*`.

**Motivo:** no hay dominios de producción definidos todavía (Fase 27 "No empezado" en
`docs/development/IMPLEMENTATION-PLAN.md`) — fijar un allowlist hoy sería inventar
dominios que no existen. Reflejar el origen es el equivalente permisivo estándar para
desarrollo/herramientas internas mientras no haya despliegue real.

**Consecuencias:** cuando se decida el hosting/dominio real de `apps/admin`/`apps/web`
(Fase 27), este middleware debería acotarse a un allowlist explícito — dejar el reflejo de
origen en producción sería una superficie de CSRF más amplia de la necesaria para una API
que ya protege cada endpoint con sesión (`Authorization: Bearer`), pero no es defensa en
profundidad gratis.

---

## 2026-09-13 — Ingestión SEPA: Mayorista primero, schema aditivo (no rename), `fileHash` para idempotencia

**Contexto:** el usuario pidió conectar DePaso a datos reales de precios/comercios, con
SEPA (Sistema Electrónico de Publicidad de Precios Argentinos) como fuente primaria. La
investigación real (no la especificación asumida) contra `datos.produccion.gob.ar` reveló
varias diferencias con el pedido original — ver `docs/data/SEPA.md` para el detalle
completo. Tres decisiones separadas, todas de la misma sesión:

**(a) Mayorista antes que Minorista.** SEPA Minorista pesa ~325-337MB/día (nacional);
Mayorista ~8-15MB/día. Se implementó y verificó el pipeline completo contra Mayorista
primero — el usuario lo eligió explícitamente para validar la arquitectura entera (CKAN →
descarga → ZIP anidado → parseo → scope geográfico → persistencia) contra datos reales sin
necesitar streaming todavía. Minorista queda pendiente de una segunda pasada que sí
implemente streaming real (sección 26 del pedido original).

**(b) Migración aditiva de `Store`/`StoreBranch`, no un rename.** El schema real de SEPA
separa razón social (`StoreCompany`, nueva) de bandera comercial (`Store`, ya existía desde
Fase 11 — ej. Cencosud S.A. es 1 `StoreCompany` con 3 `Store`: Vea/Disco/Jumbo, confirmado
real). Alternativa descartada: renombrar `Store`→`StoreBrand` como sugería el pedido
original — se decidió NO hacerlo porque `apps/admin`/`apps/api` de Fase 11 (recién
construidos la sesión anterior) ya usan `Store`/`StoreBranch` tal cual; agregar
`companyId`/campos `externalSepa*` nullable logra el mismo modelo de datos sin romper ese
código. Mismo criterio para `StoreBranch` (se le agregaron columnas, no se le cambió el
nombre) y para `PriceSourceType` (se agregaron valores `OFFICIAL_SEPA`/`RETAILER_ONLINE`/
`RECEIPT`/`MANUAL_ADMIN`, sin tocar los 4 originales).

**(c) `DataImportRun` único por `(source, fileHash)`, no por `(source, resourceId)`.**
Se detectó real (no hipotético) que CKAN reusa el mismo `resourceId` para el mismo slot de
día de la semana ("Domingo" tiene el mismo id cada semana, sólo cambia el contenido). Un
unique por `resourceId` habría bloqueado reimportar la semana siguiente — se corrigió antes
de la primera corrida real con una segunda migración (`import_run_hash_unique`).

**Verificación real:** `pnpm data:sepa:inspect --wholesale` (dry-run) y luego
`pnpm data:sepa:import --wholesale` corrieron contra el feed vivo de SEPA Mayorista
(2026-09-13): 6 comercios nacionales, 3 sucursales reales dentro de Mar del Plata (Makro,
Maxiconsumo, Mayorista Yaguar — las tres coinciden con las semillas del pedido original),
13.021 precios reales aceptados, 0 rechazados, confirmado consultando la base directamente
(no sólo el log del import). `docs/data/SEPA.md` y `PROGRESS.md` tienen el detalle
completo, incluyendo hallazgos que corrigen supuestos del pedido original (ej.
`productos_ean` no es un booleano — repite `id_producto`).

**Consecuencias:** `MarketRegion` (Mar del Plata) vive en la tabla `market_regions`, no
hardcodeada — `GeoScopeService` (`@depaso/geo`, package nuevo y puro, sin dependencia de
Prisma) la recibe como config. `StoreBranch.longitude` es `Float` no-nullable desde Fase 1
(el motor de optimización asume coordenadas siempre presentes) pero SEPA trae longitud
vacía con frecuencia real — se usa el centro de la región como aproximación explícita y se
registra `BranchDataIssue` (`MISSING_COORDINATES`) en vez de escribir `0` en silencio (que
cae frente a la costa de África). Pendiente real: conectar SEPA Minorista (streaming),
geocodificar las sucursales con `BranchDataIssue` abierto, y decidir cuándo/cómo recalibrar
el matching de producto sin EAN válido (hoy cae a nombre normalizado, con riesgo de
duplicados ya anticipado por el propio pedido original).

---

## 2026-09-13 — Mapbox Geocoding API para geocodificación real (Fase 28)

**Contexto:** probando el flujo completo de usuario en Expo Web, agregar un lugar con
dirección escrita a mano siempre fallaba ("No pudimos ubicar esa dirección"). Causa real:
`places/form.tsx`/`route-context/index.tsx` llamaban `Location.geocodeAsync`
(`expo-location`, nativo) directo desde el cliente — esa API no tiene implementación en
Expo Web (devuelve `[]` siempre ahí), y en Android real tampoco es una apuesta sólida a
largo plazo (Google viene deprecando el `Geocoder` del sistema en varias versiones/OEMs).

**Alternativas:** (a) Google Geocoding API, (b) Mapbox Geocoding API, (c) OpenStreetMap
Nominatim (gratis, sin key, pero con política de uso de 1 req/seg y prohibición de uso
productivo sin self-host).

**Decisión:** Mapbox Geocoding API ("Temporary geocoding"), resuelto server-side
(`POST /api/geocode`/`POST /api/geocode/reverse` en `apps/api`), no desde el cliente.

**Motivo:** el usuario pidió explícitamente "la que tiene key gratis". Confirmado contra la
documentación oficial de Mapbox (2026-09): 100.000 requests/mes gratis, **sin tarjeta de
crédito** para ese tier (Google Geocoding API sí exige habilitar facturación/tarjeta incluso
para quedarse dentro del crédito gratuito — más fricción para conseguir la key). Resolverlo
server-side (no repetir el error de `expo-location`) hace que funcione igual en Expo Web,
iOS y Android — no sólo tapa el síntoma de Fase 28, evita que vuelva a aparecer en producción.

**Consecuencias:** `packages/data-sources/mapbox` implementa `GeocodingProvider`
(`packages/domain/src/providers.ts`, interfaz ya existente desde Fase 1 — sin cambios ahí).
Sin `MAPBOX_ACCESS_TOKEN` seteado, `/api/geocode` responde `503 GEOCODING_NOT_CONFIGURED`
(verificado real) en vez de romper — el resto de la app sigue funcionando. El usuario debe
crear su propia cuenta de Mapbox y pegar el token en `apps/api/.env.local` — paso a paso en
`docs/development/GEOCODING-SETUP.md`. Si el volumen de producción superara 100k req/mes
algún día, Mapbox cobra desde \$0.75 cada 1.000 adicionales (sin corte automático — convendría
una alerta de uso en el dashboard de Mapbox antes de ese escenario).
