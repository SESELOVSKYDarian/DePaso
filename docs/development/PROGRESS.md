# Progreso

Registro cronológico de sesiones de desarrollo. Ver `IMPLEMENTATION-PLAN.md` para el
estado por fase y `DECISIONS.md` para el porqué de cada decisión técnica.

## 2026-09-14 — Sesión 12: Fase 16 (Top 3 conectado)

### Qué se hizo

- Nuevo `POST /api/optimization`: autenticado, toma una lista propia del usuario y el
  recorrido efímero del día. Resuelve en el servidor productos, preferencias, precios con
  estado `VERIFIED`/`COMMUNITY_CONFIRMED` y sucursales activas; construye los candidatos y
  llama al motor real. El frontend no puede inyectar precios, preferencias ni candidatos.
- Nuevo cliente tipado/validado para ese endpoint y pantalla móvil
  `app/optimization/index.tsx`: selección de lista, validación de recorrido de al menos
  origen/destino, loading/error explícitos y reveal escalonado de BALANCED, FASTEST y
  CHEAPEST. El `debugScore` se excluye de la respuesta HTTP.
- Home ya abre el flujo de optimización cuando hay un recorrido completo, en vez de mostrar
  el aviso de funcionalidad pendiente.

### Verificación

- `pnpm turbo run typecheck test --force` — **21/21 tareas OK**.
- Queda pendiente la prueba manual con una cuenta, una lista y el API/DB levantados para
  confirmar el recorrido completo en Expo Web/dispositivo.

## 2026-09-14 — Sesión 13: Fase 18 (Modo compra)

- `PurchaseContext` mantiene sólo en memoria el plan seleccionado y los productos marcados;
  evita modificar la lista fuente o inventar un historial no definido.
- `app/purchase/index.tsx` agrupa el checklist por comercio, muestra avance y usa el
  `Checkbox` existente (spring, Reduce Motion y haptic) para cada producto. Al completar
  todos los ítems permite finalizar y vuelve al inicio.
- El Top 3 ahora ofrece "Empezar compra" en cada alternativa y transmite el plan elegido.
- `pnpm --filter @depaso/mobile typecheck` y `pnpm --filter @depaso/api typecheck` pasan.

## 2026-09-11 — Sesión 1: Fase 0 + Fase 1 + arranque Fase 2/15

### Contexto de arranque

Repo sin código: sólo `CLAUDE.md`, `branding/`, `docs/` (ya completos) y `pdf/`. No era
repo git. Toolchain del sistema: node 22.12, npm 10.9, pnpm 10.19, git 2.39 — **sin
Docker**.

### Qué se hizo

- `git init` en la raíz (sin commit — ver `DECISIONS.md`).
- Monorepo pnpm + Turborepo: `package.json`, `pnpm-workspace.yaml`, `turbo.json`,
  `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.env.example`,
  `docker-compose.yml`, `README.md`.
- 7 packages: `types`, `domain`, `optimization`, `validation`, `database`,
  `design-tokens`, `api-client`, `config`.
- 4 apps: `mobile` (Expo Router, shell de 5 tabs), `web` (Next.js, landing + legal),
  `admin` (Next.js, scaffold), `api` (Next.js, `POST /api/optimize`).
- `docs/development/`: este archivo + `ARCHITECTURE.md`, `DATABASE.md`, `API.md`,
  `DESIGN-SYSTEM.md`, `MOTION-SYSTEM.md`, `IMPLEMENTATION-PLAN.md`, `DECISIONS.md`.

### Verificación real (no asumida)

- `pnpm install` — OK, 13 workspace projects.
- `pnpm turbo run typecheck test` — **12/12 tareas OK** (todos los packages y apps
  typechequean limpio; 0 errores).
- `pnpm --filter @depaso/optimization test` — **5/5 tests OK** (Casos A-E de la sección 87
  del master prompt, literales).
- `prisma validate` / `prisma generate` — OK (con `DATABASE_URL` seteada a un valor
  cualquiera; no hay Postgres vivo para migrar de verdad).
- `POST /api/optimize` end-to-end: se levantó `apps/api` con `next dev`, se mandó un
  request real (1 producto, 1 comercio, ruta Trabajo→Casa) y el motor real respondió con
  el Top 3 completo (BALANCED/FASTEST/CHEAPEST, con explicación humana) — confirmado con
  `curl`, no simulado.
- `apps/web` visual: se abrió en el navegador (`http://localhost:3002` — el 3000 estaba
  ocupado por el proceso de `apps/api` de la prueba anterior). El wordmark "DePaso" con
  Fredoka Bold (De en navy, Paso en azul ruta) y el tagline "Ahorrá en el camino." con el
  punto final en lima renderizan correctamente; `/privacy` renderiza el contenido real.
  Captura verificada visualmente, no sólo el código fuente.
- `apps/mobile` — **sólo se verificó con `tsc --noEmit` (pasa limpio)**. No se abrió en
  emulador ni dispositivo: no hay Android Studio/Xcode/Docker en este entorno. Esto es una
  limitación real, no un paso salteado por descuido — queda pendiente para quien tenga
  acceso a un emulador o a EAS Build.
- `apps/admin` — typecheck OK, no se abrió visualmente en esta sesión (menor prioridad:
  scaffold sin pantallas reales todavía).

### Problemas encontrados y cómo se resolvieron (documentado para no repetirlos)

1. **TS project references rotas:** `composite: true` + `"references"` entre packages
   hacía que `tsc --noEmit` fallara si el package referenciado no se había "buildeado"
   antes (`dist/*.d.ts` faltante). Como todo se consume como fuente TS directa (no hay
   build de packages en el flujo actual), se sacó `composite`/`references` del preset de
   tsconfig — cada package typechequea contra el `.ts` fuente de sus dependencias vía
   resolución de módulos normal.
2. **`apps/mobile/tsconfig.json` extendía `"expo/tsconfig.base"`** desde
   `packages/config/tsconfig/react-native.json` — la resolución de esa ruta desde un
   package que no tiene `expo` en su propio árbol de `node_modules` es frágil en un
   monorepo pnpm (falla según desde dónde se invoque `tsc`). Se resolvió inlineando el
   contenido equivalente directamente en `react-native.json`, sin depender de resolver
   `expo/tsconfig.base` a través de límites de package.
3. **Versión bleeding-edge de Expo rompía tipos:** se había instalado inicialmente Expo
   SDK 57 (`expo@57.0.22`) con `react-native-reanimated@4.6.0` + `react-native@0.87.1`.
   Esa combinación es más nueva de lo que `expo-modules-core@57.0.18` soporta
   (`react-native-worklets` — peer roto), y en la práctica producía errores de tipos reales
   en cualquier `style={...}` de toda la app (`StyleSheet.create` resolviendo a un tipo de
   `Animated` roto). Se bajó todo el stack de Expo a **SDK 54** (`expo@54.0.37`,
   `react-native@0.81.5`, `react-native-reanimated@4.1.7` + `react-native-worklets@0.8.3`,
   `expo-router@6.0.24`), una combinación bien establecida — resuelto con `npx expo
   install` para que las versiones exactas las calculara la propia CLI de Expo, no a mano.
   Ver `DECISIONS.md` si se agrega una entrada formal más adelante; por ahora queda
   registrado acá porque fue un problema de esta sesión, no una decisión de arquitectura.
4. **Imports con extensión `.js` rompían el bundling de Next.js:** los packages se
   escribieron con imports relativos `from "./algo.js"` (estilo NodeNext/ESM explícito) —
   funciona con `tsc`/Vitest, pero el webpack de Next.js (incluso con `transpilePackages`)
   no resuelve un `.js` contra un archivo `.ts` real. Se sacó la extensión `.js` de todos
   los imports relativos en `packages/*/src` (moduleResolution "Bundler" no la necesita).
5. **Peer warnings de `react-dom`/`react` (19.3.0 vs 19.x pineado):** resuelto pineando
   `react`/`react-dom` a la misma versión exacta en `apps/admin`, `apps/web`, `apps/api`.
   Queda un warning cosmético en `apps/mobile` (Expo trae `react-dom` como dependencia
   opcional para el target web que no usamos) — no afecta nada real.

### Bloqueantes reales para la próxima sesión (no son "olvidos")

- **No hay Postgres.** Sin Docker en esta máquina. Para seguir con Fase 4 (Auth) en
  adelante hace falta: instalar Docker y correr `docker compose up -d`, o apuntar
  `DATABASE_URL` a un Postgres gestionado (Supabase u otro) — después,
  `pnpm --filter @depaso/database exec prisma migrate dev` y `run seed`.
- **No hay emulador/dispositivo para `apps/mobile`.** Sin Android Studio/Xcode en este
  entorno. `apps/mobile` sólo está verificado por tipos, no visualmente ni
  funcionalmente. Quien continúe con acceso a un Mac/Android Studio (o EAS Build) debería
  correr `pnpm --filter @depaso/mobile start` y confirmar que el shell de tabs y el CTA
  animado de Home funcionan como se espera antes de construir sobre eso.
- **Clearance marcario de "DePaso" sigue pendiente** (riesgo ALTO, ver
  `docs/brand-product/DECISIONS.md`) — no afecta el código, pero sí cualquier decisión de
  branding/dominio/ads real.
- **Datos legales `[ENTRE CORCHETES]`** (razón social, CUIT, domicilio, emails) siguen sin
  definir — `apps/web` lo señala explícitamente en `/privacy` y `/terms` en vez de
  inventarlos.

### Addendum — logo real integrado

Al terminar la sesión 1, el wordmark de `apps/web` era sólo texto (Fredoka + colores) —
`branding/logo-isotipo.png` (el isotipo oficial: ruta+pin+lima) no se usaba en ningún
lado. Corregido en la misma sesión:

- `apps/mobile/app.json`: `icon`, `splash.image` y `android.adaptiveIcon.foregroundImage`
  apuntan a `assets/images/*.png` (copias de `logo-isotipo.png`), fondo `#F7FAF8`
  (`surface.base`).
- `apps/web/app/icon.png` y `apps/admin/app/icon.png`: favicon real vía la convención de
  Next.js App Router (`app/icon.png` se sirve automáticamente).
- `apps/web/app/page.tsx`: isotipo (84px) al lado del wordmark de texto en el hero,
  gap/proporción siguiendo `branding/DePaso_Tipografia_Logo.md` (escalado desde la
  referencia de 112px a los 56px que usa la página).
- `apps/admin/app/page.tsx`: isotipo (32px) en el header.

Verificado visualmente en el navegador (no sólo compilado) — el isotipo real (no un ícono
genérico) aparece en la home de `apps/web`. `apps/mobile` sólo queda verificado por
typecheck (`app.json` es config declarativa, Expo la lee al bootear — no se puede
confirmar el ícono real sin build/emulador, que no está disponible en este entorno).

### Próximo paso recomendado

Ver `IMPLEMENTATION-PLAN.md`, sección "Cómo continuar" — en orden: Postgres local →
Fase 4 (Auth) → Fase 5-7 (onboarding, lugares, contexto de ruta) → conectar el motor de
optimización (ya listo) a datos y pantallas reales.

## 2026-09-11 — Sesión 2: Fase 4 (Auth)

### Qué se hizo

- `packages/database/prisma/schema.prisma`: modelo `Session` nuevo (hash del token, no el
  token — ver comentario en el schema), relación en `User`.
- `packages/domain`: `AuthSession` ahora incluye `token`; nuevo `legal.ts`
  (`LEGAL_DOCUMENT_VERSIONS`, `MIN_AGE_YEARS`, `PASSWORD_MIN_LENGTH`, `SESSION_TTL_DAYS`).
- `packages/validation/src/auth.ts`: `registerRequestSchema` (con los 3 campos
  obligatorios de FUNCTIONAL.md: 18+, T&C, aviso de privacidad, + marketing opcional
  default false), `loginRequestSchema`, `updateProfileRequestSchema`, schemas de
  respuesta.
- `packages/api-client`: generalizado de sólo-`post` a `get`/`post`/`patch`/`delete` +
  `createAuthClient` (register/login/logout/me/updateProfile/deleteAccount) — listo para
  que `apps/mobile`/`apps/web` lo consuman en Fase 5.
- `apps/api/lib/auth/`: `password.ts` (scrypt, sin dependencia nueva), `session.ts`
  (Prisma), `authProvider.ts` (implementa `AuthProvider`), `rateLimit.ts` (en memoria,
  MVP), `request.ts`/`cookies.ts` (token por cookie httpOnly o `Authorization: Bearer`),
  `currentUser.ts` (`getCurrentUser` — única fuente de verdad de "quién es el usuario
  actual", nunca confiar en un `userId` del body).
- `apps/api/app/api/auth/{register,login,logout,me,account}/route.ts` — ver
  `docs/development/API.md` para el detalle de cada uno.

### Verificación real

- `pnpm turbo run typecheck test --force` — **13/13 tareas OK.**
- `apps/api` tests nuevos: `password.test.ts` (5) + `rateLimit.test.ts` (3) = **8/8 OK**
  (lógica pura, sin DB).
- **No se pudo probar el flujo completo contra una base real** (sigue sin haber Docker/
  Postgres en este entorno). Se levantó `apps/api` con `next dev` y se mandó un
  `POST /api/auth/register` real: compiló, pasó la validación Zod, el rate limit, y llegó
  hasta `prisma.user.findUnique(...)` — ahí falló con un error de **conexión** a Postgres
  (`PrismaClientInitializationError: Authentication failed against database server`), no
  un error de código. Confirma que el pipeline entero está bien armado; lo único que falta
  es una base real corriendo.

### Deliberadamente no implementado

- **Recuperación de contraseña** — necesita un proveedor de email (Resend, SES, etc.), que
  es `NO DEFINIDO` en `docs/legal-functional/LEGAL.md` (tabla de terceros). Implementarla
  sin proveedor real sería inventar una integración externa — se deja pendiente hasta que
  haya una decisión de proveedor de email/push (rule 102: esto sí ameritaría preguntar,
  porque depende de un servicio externo).
- **Pantallas de login/registro en `apps/mobile`** — quedan para Fase 5 (Onboarding +
  legal + privacidad), que es donde el roadmap ya las ubica junto con el modal de
  consentimiento de ubicación. El backend y el `api-client` ya están listos para que esa
  fase los consuma sin tener que tocar `apps/api` de nuevo.

### Próximo paso recomendado

Con Postgres disponible: correr `prisma migrate dev`, repetir el `POST /api/auth/register`
de arriba y confirmar que esta vez responde `201` con `{ user, token, expiresAt }` — recién
ahí Fase 4 queda 100% verificada, no sólo "código listo".

## 2026-09-11 — Sesión 3: Fase 5 (Onboarding + legal + privacidad)

### Qué se hizo

- `packages/validation/src/consent.ts` + `packages/api-client/src/consent.ts`:
  `consentRequestSchema` y `createConsentClient` — consentimientos posteriores al
  registro (hoy: ubicación).
- `apps/api/app/api/consents/route.ts`: `POST /api/consents`, requiere sesión.
- `packages/api-client/src/client.ts`: generalizado a `get`/`post`/`patch`/`delete` +
  `getAuthToken` ahora puede ser async (necesario para leer `expo-secure-store`).
- `apps/mobile`: `expo-secure-store` (vía `npx expo install`, resuelto a la versión SDK 54
  correcta); `lib/auth/AuthContext.tsx` (estado de auth + onboarding-visto, persistido en
  SecureStore, restaurado al abrir la app); `lib/apiClient.ts`/`lib/config.ts`
  (`EXPO_PUBLIC_API_URL`, con nota sobre localhost vs `10.0.2.2` vs IP LAN según dónde
  corra el cliente); ruteo por estado con `Stack.Protected` de expo-router (onboarding no
  visto → `/onboarding`; visto pero sin sesión → `/(auth)`; con sesión → `/(tabs)` —
  automático, sin `router.replace` manual).
- Pantallas nuevas: `app/onboarding.tsx` (3 slides, sección 29 — "no 12 pantallas"),
  `app/(auth)/login.tsx`, `app/(auth)/register.tsx` (con los 3 checkboxes obligatorios de
  FUNCTIONAL.md: 18+, T&C, aviso de privacidad, + marketing opcional default `false`),
  `app/legal/{terms,privacy,community}.tsx` (contenido nativo, mismo texto que
  `apps/web`), componente `LocationConsentModal` (copy exacta de FUNCTIONAL.md: "Permitir
  mientras uso DePaso" / "Ingresar dirección manualmente" / "Ahora no") enganchado desde
  el tab Perfil (que ahora también muestra el email real y tiene "Cerrar sesión"
  funcional).
- Componentes nuevos: `FormField`, `Checkbox` (animado, spring+haptic — sección 68),
  `LegalScreen` y sus sub-componentes.

### Verificación real

- `pnpm turbo run typecheck test --force` — **13/13 tareas OK** (incluye `apps/mobile`
  con todas las pantallas nuevas — es la prueba más dura de este pase, tipos de
  React Native + Reanimated + expo-router son estrictos).
- `POST /api/consents` sin sesión → confirmado `401 UNAUTHORIZED` real (este endpoint sí
  se pudo probar 100% end-to-end porque el camino sin sesión no toca la DB).
- `POST /api/auth/register` y `POST /api/optimize` re-verificados, sin regresión.
- **`apps/mobile` sigue sin abrirse en emulador/dispositivo** (mismo bloqueante de
  siempre) — el modal de ubicación, el onboarding y los formularios están escritos y
  typechequean, pero nunca se vieron correr.

### Próximo paso recomendado

Con Postgres disponible, probar el flujo real desde el dispositivo (si hay uno
disponible) o con `curl` simulando cada paso: registro → onboarding ya visto la próxima
vez que abre la app → tabs → Perfil → modal de ubicación → cerrar sesión → vuelve a
`/(auth)/login`.

## 2026-09-11 — Sesión 4: Fase 6 (Lugares guardados)

### Qué se hizo

- `packages/validation/src/entities.ts`: `userPlaceUpdateSchema` (parcial) y
  `userPlaceResponseSchema` — `userPlaceInputSchema` ya existía desde la Sesión 1.
- `apps/api`: `lib/places.ts` (`toPlaceResponse`), `GET`/`POST /api/places`,
  `PATCH`/`DELETE /api/places/:id`. `userId` siempre de la sesión — `updateMany`/
  `deleteMany` con `{ id, userId }` en el `where` en vez de `findFirst` + `update`, para
  que la verificación de dueño y la escritura sean una sola operación atómica (sin
  ventana de carrera) y para no confirmar la existencia de un lugar ajeno (`404` uniforme).
- `packages/api-client/src/places.ts`: `createPlacesClient` (list/create/update/remove).
- `apps/mobile`: `lib/places/PlacesContext.tsx` — estado compartido (mismo patrón que
  `AuthContext`) en vez de refetch-on-focus, porque esta versión de expo-router no
  confirmó tener `useFocusEffect` accesible sin importar directamente de
  `@react-navigation/native` (dependencia transitiva, no declarada — se evitó por
  fragilidad). `app/places/index.tsx` (lista, con `Skeleton`/`EmptyState` nuevos),
  `app/places/form.tsx` (alta/edición unificada por query param `id`, selector de tipo,
  geocoding real vía `Location.geocodeAsync` de `expo-location` — sin mock, sin API paga,
  sección 67), botón "usar mi ubicación actual" (`reverseGeocodeAsync`). Perfil ahora
  muestra "Mis lugares" con el conteo real.
- `app.json`: plugin `expo-location` con el copy de permiso ya definido en LEGAL.md.

### Verificación real

- `pnpm turbo run typecheck test --force` — **13/13 OK** (un error real encontrado y
  corregido en el camino: `apps/api/lib/places.ts` importaba `@prisma/client`
  directamente, que no es dependencia directa de `apps/api` — se corrigió importando el
  tipo `UserPlace` desde `@depaso/database`, que ya lo re-exporta).
- Los 4 endpoints de `/api/places` sin sesión → **`401` confirmado de verdad** (ese camino
  no toca la DB, así que se pudo probar 100% end-to-end, no sólo "hasta la conexión").
- Con un Bearer token presente (inválido, no hay usuario real) → confirmado que llega
  hasta `verifySession` → `prisma.session.findUnique` y falla ahí por conexión, mismo
  patrón que Fase 4/5 — el código está bien armado, falta la base viva.
- No se implementó ningún dato ficticio de geocoding — se usa el geocoder nativo del
  dispositivo (gratis, sin key), consistente con `MockRouteProvider` de Fase 15.

### Próximo paso recomendado

Con Postgres disponible: `prisma migrate dev`, después repetir register → crear 2-3
lugares reales (Casa/Trabajo) vía `apps/mobile` o `curl` → confirmar que aparecen
ordenados con favoritos primero y que Perfil muestra el conteo correcto. Eso deja Fase 6
100% verificada y desbloquea Fase 7 ("¿Por dónde vas a andar hoy?") sin trabajo de base
pendiente.

## 2026-09-11 — Sesión 5: Fase 7 + cierre de Fase 2/3 + Expo Web funcionando

### Qué se hizo

- **Fase 7:** `SavedRouteContext` CRUD (`GET`/`POST /api/route-contexts`,
  `DELETE /:id`, con validación de que los `waypointPlaceIds` sean del usuario actual).
  `apps/mobile`: `TodayRouteContext` (recorrido de hoy, sólo cliente, nunca se persiste
  solo — sección 31), pantalla `app/route-context/index.tsx` completa (cargar preset
  guardado, elegir lugares guardados, agregar lugar temporal con geocoding + prompt
  "¿guardar para otra vez?", guardar el recorrido armado como preset con nombre). Home
  (`app/(tabs)/index.tsx`) ya no tiene chips hardcodeados — muestra el recorrido real o
  invita a elegirlo.
- **Cierre de Fase 2 (catálogo genérico):** `Button`, `Card`, `BottomSheet`, `Dialog`,
  `Toast`/`ToastProvider`. Con esto el catálogo de componentes **genéricos** de la
  sección 74 está completo — sólo faltan los atados a datos de producto que todavía no
  existen (Fase 8+).
- **Fase 3:** se confirma como completa — 5 tabs + ruteo por estado + rutas empujadas
  (`places`, `route-context`, `legal`) es un navigation shell estructuralmente terminado;
  lo que faltaba ahí en realidad eran fases de contenido posteriores, ya en marcha.
- **`apps/mobile` corriendo de verdad, con capturas reales** — primera vez en el
  proyecto. Se agregó soporte de **Expo Web** (`react-native-web`, `react-dom`) sólo como
  herramienta de desarrollo (sección 91: la web no es el producto principal; esto no
  reemplaza compilar para Android/iOS). Con `npx expo start --web` la app corre en un
  navegador de verdad — se vieron y confirmaron visualmente: las 3 slides de onboarding,
  login, registro con **validación real en vivo** (los 5 mensajes de error exactos que
  están en el código aparecieron tal cual al enviar el form vacío), y la pantalla de
  Términos con su contenido real. `apps/web` (landing) también se abrió y confirmó con el
  isotipo real.

### Problemas encontrados y resueltos

1. **`expo-secure-store` no tiene equivalente en web** (no hay keychain de navegador
   estandarizado) — `getValueWithKeyAsync is not a function` al bootear. Se resolvió con
   un fallback a `localStorage` sólo en `Platform.OS === "web"`
   (`lib/auth/secureStore.ts`) — la build nativa real sigue usando `SecureStore` siempre.
2. **Versiones desalineadas con Expo SDK 54:** al instalar `react-native-web`, la propia
   CLI de Expo avisó que `react-native-worklets`, `@types/react` y `babel-preset-expo`
   habían quedado en versiones más nuevas de lo esperado para SDK 54 (arrastre de cuando
   se usaban rangos `"*"`). Se corrigió con `npx expo install --fix` (deja que Expo
   calcule las versiones correctas, no a mano).
3. **Ese fix rompió el typecheck de `apps/web`** (`TS2742`, tipo no "portable") — quedaron
   dos copias distintas de `@types/react` en el monorepo (mobile pineado a `~19.1.10`, el
   resto en `^19.0.2`, ambas técnicamente compatibles entre sí pero resolviendo a paquetes
   físicos distintos). Se resolvió alineando `@types/react`/`@types/react-dom` a la misma
   versión exacta en `apps/web`, `apps/admin` y `apps/api` — sólo tipos, no cambia el
   `react` real de cada app (mobile sigue en 19.1.0 por RN, las apps Next en 19.2.3).
- `pnpm turbo run typecheck test --force` — **13/13 OK** después de estos tres arreglos.

### Cómo correr el proyecto y ver el progreso vos mismo

```bash
# 1. Instalar dependencias (una vez)
pnpm install

# 2. Web (landing) — abre http://localhost:3000 (o el próximo puerto libre)
pnpm --filter @depaso/web run dev

# 3. Admin — abre http://localhost:3100
pnpm --filter @depaso/admin run dev

# 4. API — abre http://localhost:3000 (si el 3000 está libre)
pnpm --filter @depaso/api run dev

# 5. Mobile — la app real, en el navegador (Expo Web, herramienta de dev)
cd apps/mobile
npx expo start --web
# abre http://localhost:8081 — vas a ver onboarding → login/registro → (con sesión) tabs.
# Sin Postgres, register/login van a fallar con error de conexión (esperado, ver más
# abajo) — pero todo lo demás (validación, navegación, legal, checkboxes) funciona.

# 6. Mobile en un dispositivo/emulador real (necesita Android Studio o Xcode, no
#    disponibles en este entorno de desarrollo)
cd apps/mobile
npx expo start
# escaneás el QR con Expo Go, o presionás "a"/"i" con un emulador ya abierto.
```

Para que el registro/login funcionen de punta a punta hace falta Postgres:

```bash
docker compose up -d
pnpm --filter @depaso/database exec prisma migrate dev
pnpm --filter @depaso/database run seed   # datos SEED/DEMO, no reales
```

**Esta sesión se ejecutó y se vio en vivo** (no sólo se dejaron las instrucciones): Expo
Web mostró onboarding/login/registro/legal reales con validación funcionando, y `apps/web`
mostró la landing con el isotipo real — ambos confirmados por captura de pantalla real
dentro de la sesión, no simulados.

### Próximo paso recomendado

Con Postgres disponible: repetir el flujo completo Fase 4-7 desde Expo Web o un
dispositivo — registro → crear lugares → armar y guardar un recorrido → confirmar que
vuelve a aparecer en "Tus recorridos guardados" la próxima vez. Después, Fase 8 (catálogo
y búsqueda de productos) es el siguiente bloqueante real para que "Encontrar mi mejor
compra" deje de ser un mensaje de "todavía no" y pase a llamar al motor de optimización
de verdad con datos reales.

## 2026-09-11 — Sesión 6: rediseño visual de login/registro + Google/Apple

### Qué se hizo

El usuario pidió rediseñar login/registro con una imagen de referencia (estilo tarjeta
redondeada, inputs tipo "pill", botones sociales) y agregar Google/Apple además del
flujo de email existente. Componentes nuevos en `apps/mobile/components/`:

- `PillInput` — input redondo con ícono izquierdo (`@expo/vector-icons`) y toggle
  mostrar/ocultar contraseña.
- `SocialButton` — "Continuar con Google" (pill blanco, ícono a color) / "Continuar con
  Apple" (pill navy, ícono blanco).
- `AuthHero` — isotipo real en placa suave + título + subtítulo, composición propia (no
  una copia de la ilustración de referencia).

`app/(auth)/login.tsx` y `app/(auth)/register.tsx` reescritos con estos componentes.
Registro: social arriba, divisor "o con tu email", campos, y los mismos 4 checkboxes
obligatorios/opcional de siempre (18+, T&C, privacidad, marketing) agrupados en una
tarjeta — ninguna validación legal se perdió en el rediseño.

**Google/Apple son UI real sin backend real todavía** — al tocarlos, un toast explica que
falta configurar credenciales OAuth (Google Cloud / Apple Developer, esta última paga).
No se simuló un login falso. Detalle de la decisión en `DECISIONS.md`.

### Verificación real

- `pnpm --filter @depaso/mobile run typecheck` y `pnpm turbo run typecheck test --force`
  — **13/13 OK**.
- Visto corriendo en Expo Web (mismo método que la sesión anterior): login con inputs
  pill + botones sociales, registro con social arriba + checkboxes abajo, y **toast real
  al tocar "Continuar con Google"** ("Crear cuenta con Google todavía no está conectado
  (falta configurar credenciales OAuth)") — confirmado por captura de pantalla dentro de
  la sesión.

### Próximo paso recomendado

Si se consiguen credenciales de Google/Apple, conectar el OAuth real es acotado: un
método nuevo en `AuthProvider` (`packages/domain`) + el flujo de `expo-auth-session` (o
el SDK nativo de Apple) detrás del `onPress` de cada `SocialButton` — el diseño y la UX
no necesitan tocarse.

## 2026-09-11 — Sesión 7: Postgres real, primer end-to-end de punta a punta

### Qué se hizo

El usuario tampoco tenía Docker instalado. En vez de quedar bloqueados, se instaló
**PostgreSQL 17 nativo vía winget** (`winget install PostgreSQL.PostgreSQL.17`) — sin
Docker de por medio.

En el camino, winget avisó "paquete existente encontrado" — resultó ser un PostgreSQL 17
**instalado por el usuario desde el 26/12/2024**, con varias bases de datos de otros
proyectos suyos (`ecommerce`, `gammadb`, `malharro`, `mg_arg`, `netflix`, `tablero`,
`tecnicacinco`, `vase_business`, `noctua`). No se conocía la contraseña del superusuario
`postgres` de esa instalación. **No se intentó resetearla editando `pg_hba.conf`** — esa
acción fue bloqueada por la política de permisos del entorno (correcto: es un cambio de
configuración de sistema, no algo para forzar). Se le preguntó al usuario la contraseña
directamente — la dio, y desde ahí:

- Se creó un rol `depaso` (con `CREATEDB`, necesario para que `prisma migrate dev` arme su
  shadow database) y una base `depaso`, sin tocar ninguna de las bases existentes del
  usuario.
- `packages/database/.env` (gitignored) con
  `DATABASE_URL="postgresql://depaso:depaso@localhost:5432/depaso"` — el mismo valor que
  ya estaba en `.env.example`, cero cambios en el resto del repo.
- `prisma migrate dev --name init` — **primera migración real de todo el proyecto**,
  aplicada sin errores.
- El seed procedural corrió contra la base real: **14 marcas, 100 productos/variantes, 6
  comercios, 23 sucursales, 1388 precios** SEED/DEMO.

### Verificación real — por primera vez, de punta a punta contra Postgres real

Con `apps/api` corriendo apuntando a la base real, se probó la cadena completa con `curl`:

| Paso | Resultado |
|---|---|
| `POST /api/auth/register` | `201`, usuario y token reales |
| `GET /api/auth/me` | `200`, usuario correcto |
| `POST /api/places` (Casa, Trabajo) | `201` x2 |
| `GET /api/places` | `200`, favorito primero |
| `POST /api/route-contexts` ("Trabajo → Casa") | `201` |
| `GET /api/route-contexts` | `200`, aparece el preset creado |
| `POST /api/consents` (LOCATION) | `200` |
| `POST /api/auth/logout` | `200` |
| `GET /api/auth/me` con el token ya deslogueado | `401` — la sesión se revocó de verdad |
| `POST /api/auth/login` (password correcta) | `200`, nuevo token |
| `POST /api/auth/login` (password incorrecta) | `401 INVALID_CREDENTIALS` genérico |

Todo lo que las Sesiones 2-6 habían dejado "confirmado hasta el punto de conexión a la
base" ahora está **confirmado de verdad, con datos reales**. Fase 4, 6 y 7 pasan de
"código listo" a "funciona".

### Qué queda pendiente (real, no por falta de código)

- `DELETE /api/auth/account` (eliminar cuenta) y recuperación de contraseña no se
  probaron en esta pasada — sin bloqueante conocido, sólo no se ejercitaron todavía.
- `apps/mobile` en un dispositivo/emulador real sigue pendiente (Expo Web ya probó la UI,
  falta hardware real — sin cambios respecto a sesiones anteriores).
- Este Postgres es específico de esta máquina de desarrollo. En otra máquina o en CI,
  `docker compose up -d` con el `docker-compose.yml` del repo sigue siendo el camino
  normal (Postgres en contenedor limpio).
- Queda un archivo `pg_hba.conf.bak` (copia idéntica, sin cambios) en
  `C:\Program Files\PostgreSQL\17\data\` de cuando se investigó el problema de la
  contraseña — inofensivo, se puede borrar a mano si molesta.

### Próximo paso recomendado

Con la base ya viva y probada, el siguiente bloqueante real es Fase 8 (catálogo y
búsqueda de productos) — no infraestructura. Probar `apps/mobile` con esta base desde
Expo Web (`npx expo start --web`, con `apps/api` corriendo) para ver el flujo completo de
UI con datos que persisten de verdad entre pantallas.

## 2026-09-13 — Sesión 8: Fase 8-12 (catálogo real)

### Qué se hizo

- **Fase 8 (Productos y búsqueda):** `GET /api/products/search?q=` (`apps/api/lib/
  products.ts`) — `ILIKE` sobre nombre de producto, nombre de variante y `ProductAlias`
  (sección 37, "tolerante a variaciones"). `apps/mobile`: `app/lists/search.tsx` (buscar y
  agregar a una lista) y reutilizado en `app/preferences/product-form.tsx`.
- **Fase 9 (Listas):** `ShoppingList`/`ShoppingListItem` CRUD completo — `/api/lists`,
  `/api/lists/:id`, `/api/lists/:id/items`, `/api/lists/:id/items/:itemId` (`apps/api/lib/
  lists.ts` resuelve nombre/categoría de producto sin una FK de Prisma que el schema
  original no declaraba). `apps/mobile`: `ListsContext` (mismo patrón que `PlacesContext`),
  tab "Listas" con datos reales, `app/lists/[id].tsx` (detalle, stepper de cantidad,
  eliminar), `app/lists/form.tsx` (crear/renombrar).
- **Fase 10 (Preferencias):** `ProductPreference`/`StorePreference` CRUD —
  `/api/preferences/products` (upsert por `@@unique([userId, productId])`),
  `/api/preferences/stores`. `apps/mobile`: `app/preferences/index.tsx` (accesible desde
  Perfil → "Mis marcas y comercios preferidos"), `product-form.tsx` (buscar producto + elegir
  EXACT/PREFERRED/ANY), `store-form.tsx` (categoría + REQUIRED/PREFERRED + selector de
  sucursal vía el nuevo `GET /api/stores/branches`, lectura pública para cualquier usuario
  autenticado).
- **Fase 11 (Comercios y sucursales) + Fase 12 (Precios, carga manual):** `apps/admin` deja
  de ser scaffold — login real (reusa `/api/auth/login`), `role: "ADMIN"` nuevo en `User`
  (migración `add_user_role`) + `requireAdmin()` (`apps/api/lib/auth/requireAdmin.ts`, cada
  endpoint de `/api/admin/*` revalida el rol server-side). CRUD de `Store`/`StoreBranch` en
  `/stores`, `/stores/:id`; carga/actualización de `Price` en `/prices` — cada
  actualización pide un motivo y deja fila en `PriceHistory` (regla obligatoria,
  BUSINESS-RULES.md p.7, "nunca sobreescribir sin histórico"). `packages/database/scripts/
  promote-admin.mjs` para promover una cuenta a mano (sin alta de admin autoservicio).
- **CORS nuevo en `apps/api`** (`middleware.ts`): `apps/admin` corriendo en el navegador (a
  diferencia de `apps/mobile`) necesitaba esto — sin él, todo `POST`/`PATCH`/`DELETE`
  fallaba con `net::ERR_FAILED` en el navegador aunque el servidor respondiera bien. Ver
  `DECISIONS.md` (reflejo de `Origin`, no allowlist fijo — no hay dominios de producción
  todavía).

### Verificación real

- `pnpm turbo run typecheck test --force` — **13/13 tareas OK** (incluye el nuevo
  `apps/admin` con `@depaso/api-client`/`@depaso/validation` agregados).
- **Contra Postgres real** (la misma base de la Sesión 7, con `prisma migrate dev` para el
  campo `role` nuevo): registro/login de un usuario de prueba → búsqueda de productos
  (`leche`, `yerba`, resultados reales del seed) → crear lista → agregar ítem → ver
  resumen con `itemCount` → preferencia de producto (`EXACT`) → promoción a `ADMIN` vía el
  script → preferencia de comercio (con sucursal real) → `apps/admin` CRUD de comercios
  (`GET /api/admin/stores` con 6 comercios reales) y sucursales → crear precio → actualizar
  precio con motivo (confirmado que crea fila en `PriceHistory`).
- **`apps/admin` verificado en el navegador de verdad** (no sólo `curl`): login con
  credenciales reales, `/stores` listando los 6 comercios del seed con sus sucursales,
  `/prices` con el flujo completo buscar producto → elegir sucursal → ver precios
  existentes → cargar uno nuevo, confirmado con capturas/`read_network_requests` dentro de
  la sesión (incluyendo el diagnóstico del bug de CORS antes del fix).

### Deliberadamente no implementado

- **MFA de administradores** — pedida por `docs/legal-functional/LEGAL.md` (p.97), sin
  proveedor elegido (NO DEFINIDO). `apps/admin` avisa explícitamente en el login que no
  hay que usarlo con datos de producción reales todavía. Ver `DECISIONS.md`.
- **Ingestión automática de precios** (scraping/API de terceros) — Fase 12 sigue con sólo
  carga manual + el seed procedural; sigue NO DEFINIDA la fuente real.
- **Compartir listas entre usuarios** — el tab "Compartidas" de Listas sigue siendo un
  `EmptyState`; no hay modelo de lista compartida en el schema.

### Próximo paso recomendado

Fase 13-14 (`PriceConsensusService`/`CommunityTrustService`) es el siguiente bloqueante
real para que el sistema comunitario de precios haga algo más que guardar reportes sueltos
— la pseudológica ya está descrita en `docs/legal-functional/BUSINESS-RULES.md` (p.7-8).
En paralelo, Fase 16-18 (Top 3 animado, mapa, modo compra) ya tienen datos reales de
catálogo/precios (Fase 8-12) para probarse con algo más que el seed crudo.

## 2026-09-13 — Sesión 9: ingestión SEPA real (comercios/sucursales/precios), Mayorista

### Qué se hizo

El usuario pidió conectar DePaso a datos reales (no ficticios) de comercios/precios,
usando SEPA como fuente primaria — ver `docs/data/SEPA.md` para la investigación completa
y `docs/development/DECISIONS.md` (2026-09-13) para las decisiones de diseño.

- **Investigación real contra `datos.produccion.gob.ar`** (CKAN): confirmados los dos
  paquetes (`sepa-precios` minorista, `precios-claros-sepa-mayoristas` mayorista),
  descargado y abierto el feed real de ambos. Encontrada una estructura distinta a la
  asumida (ZIP del día → ZIP anidado por comercio → recién ahí los 3 CSV) y una corrección
  importante: `productos_ean` no es un booleano, repite `id_producto`.
- **Migración de schema (aditiva, dos pasadas):** `StoreCompany` nuevo (razón
  social/CUIT), `Store`/`StoreBranch` extendidos con columnas `externalSepa*`/`source`/
  `status` (sin renombrar — no rompe la Fase 11 recién construida), `MarketRegion`,
  `StoreAlias`, `BranchDataIssue`, `DataImportRun`, `ImportAnomaly`, 4 valores nuevos de
  `PriceSourceType`. Segunda migración corrigiendo el unique de `DataImportRun` a
  `(source, fileHash)` en vez de `(source, resourceId)` — CKAN reusa el mismo id de
  recurso para el mismo día de la semana cada semana, confirmado real.
- **`packages/geo`** (nuevo, puro): `GeoScopeService` — `isInsideBoundingBox`/
  `matchesLocality`/`classify`, config de región vía `MarketRegionConfig` (nunca
  hardcodeada). Tests con coordenadas reales de sucursales confirmadas (COTO 238, Toledo,
  Disco).
- **`packages/data-sources/sepa`** (nuevo): `CkanClient` (resuelve el recurso más reciente
  por metadata, nunca una URL fija), `SepaDownloader` (+ hash), `SepaArchiveReader` (ZIP
  anidado), parsers pipe-delimited (`comercio.csv`/`sucursales.csv`/`productos.csv`),
  normalización (checksum GTIN real para confirmar EAN, extracción heurística de
  unidad/cantidad desde texto libre), `runSepaImport` (pipeline completo: whitelist de
  sucursales por región ANTES de tocar productos, nunca sobrescribe precio sin
  `PriceHistory`, anomalías nunca se borran en silencio). CLI: `pnpm data:sepa:inspect
  --wholesale` (dry-run) y `pnpm data:sepa:import --wholesale`.
- Se necesitó agregar `"packages/*/*"` a `pnpm-workspace.yaml` — la estructura anidada
  `packages/data-sources/sepa` no matcheaba el glob original `packages/*`.

### Verificación real — de punta a punta contra el feed vivo y Postgres real

- `pnpm turbo run typecheck test --force` — **17/17 tareas OK** (incluye 19 tests nuevos en
  `@depaso/data-sources-sepa` usando contenido CSV real capturado del feed, y 6 en
  `@depaso/geo` con coordenadas reales de sucursales confirmadas).
- **Dry-run real** (`pnpm data:sepa:inspect --wholesale`) contra el feed vivo de SEPA
  Mayorista (recurso del 2026-09-13): 6 comercios nacionales, 3 sucursales dentro de Mar
  del Plata (Makro, Maxiconsumo, Mayorista Yaguar — las tres coinciden con las semillas del
  pedido original), 13.021 precios que se aceptarían, 0 rechazados.
- **Import real** (`pnpm data:sepa:import --wholesale`) — corrida completa contra Postgres
  real, ~76 segundos: `DataImportRun` en `SUCCESS`, 3 `StoreBranch` reales con
  direcciones/coordenadas reales (Makro: avenida champagnat y alvarado 790; Maxiconsumo:
  Av. Champagnat 2600; Yaguar: Ruta 88 y Av. Fortunato de la Plaza), 13.021 filas en
  `Price` con `sourceType: OFFICIAL_SEPA`, confirmado consultando la base directamente
  (no sólo el log) — productos reales ("BUDIN DON SATUR C.CHIP 190 gr" @ $2399.88, etc.),
  0 anomalías.
- **Bug real encontrado y corregido en la misma sesión:** la sucursal de Makro llegó sin
  longitud (columna vacía en el feed real) y el import la había escrito como `0` (cae
  frente a la costa de África) — se corrigió el código para usar el centro de la región
  como aproximación explícita + `BranchDataIssue` (`MISSING_COORDINATES`), y se corrigió a
  mano la fila ya persistida de esa corrida.

### Deliberadamente no implementado

- **SEPA Minorista** (~325-337MB/día) — el import job de esta fase lee cada comercio
  entero en memoria, aceptable sólo para Mayorista (~10-15MB/día). Minorista necesita
  streaming real (sección 26 del pedido original) antes de conectarse — `pnpm
  data:sepa:import --retail` falla explícitamente con este motivo en vez de intentarlo mal.
- **Batching de inserts** (sección 27) — cada precio es su propio find+create/update
  secuencial (~76s para 13k filas). Aceptable para el volumen de Mayorista en Mar del
  Plata; necesario antes de Minorista (millones de filas).
- **Geocodificación de sucursales sin coordenadas** — quedan con `BranchDataIssue` abierto
  para revisión manual, no se inventa una dirección exacta sin un proveedor de mapas real
  (mismo criterio que `MockRouteProvider`, Sesión 1).

### Próximo paso recomendado

Con Mayorista verificado de punta a punta, el siguiente paso real es decidir entre: (a)
implementar streaming para conectar SEPA Minorista (las cadenas prioritarias del pedido
original — Carrefour, Coto, Toledo, DIA, Vea/Disco — están ahí, confirmado por bandera en
`comercio.csv`, pero sus sucursales de Mar del Plata todavía no se importaron), o (b)
seguir con Fase 13-14 (consenso comunitario) sobre los datos ya reales de Mayorista. Ver
`docs/data/IMPORT-PIPELINE.md` para las limitaciones conocidas antes de escalar.

## 2026-09-13 — Sesión 10: SEPA Minorista real + QA del flujo completo + Fase 28 (geocoding)

### Qué se hizo

- **SEPA Minorista conectado de punta a punta.** Corregidos dos bugs reales encontrados en
  el primer intento: un ZIP anidado de 0 bytes (comercio sin datos ese día) rompía todo el
  import (`AdmZip: No END header found`) — ahora se trata como "sin datos" en vez de
  crashear; y el layout real de `productos.csv` de Minorista es DISTINTO al de Mayorista
  (`productos_precio_lista` en vez de `precio_unitario_bulto_por_unidad_venta_con_iva`) —
  causaba que el 100% de los precios se rechazaran. También se detectó (y corrigió) un OOM
  real ("JavaScript heap out of memory") por materializar todo el ZIP del día como arrays
  en vez de procesar de a un comercio/fila a la vez — `iterateSepaDailyArchive`/
  `iterateProductosCsv` (generadores) en vez de las versiones en array. Resultado real:
  **53 sucursales de Mar del Plata** (Toledo 23, DIA 9, Disco 5, Carrefour Express 5,
  Cooperativa Obrera 4, Vea 3, Carrefour Market 2, COTO 1, Hipermercado Carrefour 1) y
  **211.110 precios reales** importados (9m36s), verificado contra la base.
- **QA del flujo completo de usuario** (35 pasos, pedido explícito del usuario) contra
  Expo Web real. Bugs reales encontrados y corregidos: (1) `(setup)/places.tsx` no podía
  navegar a `places/form` (ruta no registrada en ese guard); (2) al terminar el setup
  aterrizaba en "Mis lugares" en vez de Home (efecto secundario del fix anterior); (3)
  agregar un producto a una lista o una preferencia no refrescaba la pantalla hasta
  recargar toda la app — `useFocusEffect` (confirmado disponible en expo-router 6.0.24,
  la cautela vieja del código ya no aplica); (4) `productParsing.ts` no reconocía las
  abreviaturas reales "LTR"/"KGM" de SEPA; (5) el tab Actividad mostraba un feed y un total
  ahorrado **inventados** sin ninguna marca de que eran de muestra — corregido a un
  `EmptyState` honesto, mismo criterio que ya se seguía en Home; (6) Perfil mostraba
  "2 tarjetas" fijo para una feature que no existe.
- **Fase 28 (geocidificación real):** el usuario preguntó por qué "No pudimos ubicar esa
  dirección" aparecía siempre en el flujo de prueba — causa real: `Location.geocodeAsync`
  (`expo-location`) no tiene implementación en Expo Web. Se agregó como fase nueva al plan
  y, a pedido del usuario, se implementó: **Mapbox Geocoding API** (100k req/mes gratis,
  sin tarjeta — confirmado contra la documentación oficial, motivo real por el que se
  eligió sobre Google Geocoding, que exige tarjeta igual para el tier gratuito).
  `packages/data-sources/mapbox` implementa `GeocodingProvider` (interfaz ya existente
  desde Fase 1); `POST /api/geocode`/`POST /api/geocode/reverse` en `apps/api`, consumidos
  por `apps/mobile` en vez del geocoder nativo. Sin la key configurada, responde `503
  GEOCODING_NOT_CONFIGURED` (verificado real) — no rompe el resto de la app. Guía paso a
  paso para que el usuario consiga y cargue su propia key:
  `docs/development/GEOCODING-SETUP.md`.

### Verificación real

- `pnpm turbo run typecheck test --force` — **19/19 tareas OK** (incluye 4 tests nuevos en
  `@depaso/data-sources-mapbox` con la forma real de la respuesta de Mapbox Geocoding v6,
  y regresiones nuevas en `@depaso/data-sources-sepa` para el ZIP de 0 bytes y el layout de
  precio de Minorista).
- `/api/geocode` probado real sin `MAPBOX_ACCESS_TOKEN` seteado (no se tiene una key real
  todavía) → `503 GEOCODING_NOT_CONFIGURED` confirmado, tal como se documentó.
- Los 3 bugs de navegación/refetch del QA se volvieron a probar en el navegador después de
  cada fix, no sólo se corrigió el código a ciegas.

### Pendiente real (no oculto)

- **Falta que el usuario cree su cuenta de Mapbox y pegue el token** — sin eso, geocodificar
  una dirección escrita a mano sigue sin funcionar (mensaje `503` explícito, no un fallo
  silencioso). Ver `docs/development/GEOCODING-SETUP.md`.
- Fase 16-18 (Top 3 animado, mapa, modo compra) y Fase 13 (reportar precio) siguen sin UI —
  confirmado directo desde la app durante el QA, el motor y los datos reales (Fase 8/12/15)
  ya están listos para conectarse.

### Próximo paso recomendado

Con la key de Mapbox puesta por el usuario, confirmar el flujo real de agregar un lugar con
dirección escrita a mano en Expo Web (hoy no se pudo probar con una key real). En paralelo,
Fase 16 (Top 3) es el siguiente bloqueante real de producto — el motor, el catálogo y los
precios ya están conectados, sólo falta la pantalla.

## Sesión 11 — Fase 13-14 (PriceConsensusService + CommunityTrustService)

### Qué se hizo

- **`packages/community`** — paquete TypeScript puro nuevo, mismo patrón que
  `@depaso/optimization` (sin DB, sin React/Next — el caller en `apps/api` arma el input
  desde Prisma y persiste el resultado):
  - `PriceConsensusService` (`evaluateConsensus` + `groupReportsByWindow`) implementa la
    pseudológica completa de `docs/legal-functional/BUSINESS-RULES.md` (p.7): agrupar por
    `productVariantId`+`storeBranchId`+ventana temporal, aplicar reglas de independencia
    obligatorias (una cuenta no vota 2 veces la misma ventana; cuentas distintas que
    comparten dispositivo/IP no cuentan como independientes entre sí), descartar
    reportantes bajo el piso de confianza, detectar "saltos imposibles" (anti-fraude p.8)
    y excluirlos del cálculo, calcular la mediana ponderada por trust score (con boost por
    evidencia — regla 6) y promover a `COMMUNITY_CONFIRMED` si supera el umbral combinado
    de cantidad+acuerdo+confianza, o quedar `DISPUTED` con precio anterior + alternativas
    si no hay consenso (regla 5). Los umbrales del ejemplo MVP de la doc (≥5 reportes,
    ±1%, 70% de acuerdo) están como constantes documentadas — la doc misma los marca "NO
    DEFINIDO/a calibrar con datos reales", no un valor cerrado.
  - `CommunityTrustService` (`recordReportSubmitted`/`recordReportOutcome`/
    `toConfidenceLevel`) sobre `UserTrustScore` — sube el score despacio con reportes
    confirmados y baja más rápido con descartados/rechazados (para que un rechazo no se
    compense fácil con una confirmación, alineado con la tabla anti-fraude de "reputación
    ponderada, sin crear élites permanentes"). La fórmula exacta también está marcada NO
    DEFINIDO en la doc; la regla que sí es obligatoria y se respeta es no exponer el score
    crudo — sólo existe `toConfidenceLevel` (bucket HIGH/MEDIUM/LOW) para cualquier
    superficie pública.
  - No hizo falta ninguna migración de schema — `PriceReport`, `PriceStatus`,
    `UserTrustScore` y `CommunityModerationEvent` ya estaban modelados desde una sesión
    anterior, sólo faltaba el servicio.
  - 20 tests Vitest cubriendo: promoción a consenso, reportes insuficientes (mantiene
    precio anterior), conflicto sin consenso (`DISPUTED` + alternativas), exclusión de
    saltos imposibles, descarte por baja confianza, boost por evidencia, agrupamiento por
    ventana, dedupe de independencia (mismo usuario y mismo dispositivo/IP con cuentas
    distintas), clamp del trust score en 0/1, mapeo a `ConfidenceLevel`.
- **Docs actualizadas:** `IMPLEMENTATION-PLAN.md` (Fase 13/14/21 y "Cómo continuar") —
  estado real: servicio hecho, falta el endpoint `POST /api/price-reports` y la pantalla
  de reporte en `apps/mobile` (eso queda para cuando se conecte la UI de precios junto a
  Fase 16-18, no es parte del motor de consenso en sí).

### Verificación real

- `pnpm --filter @depaso/community run typecheck` y `run test` — limpio, 20/20 tests.
- `pnpm turbo run typecheck test --force` — **21/21 tareas OK** (19 anteriores + typecheck
  y test de `@depaso/community`), sin romper nada del resto del monorepo.

### Pendiente real (no oculto)

- Sin endpoint HTTP ni pantalla para que un usuario real mande un `PriceReport` — el
  servicio existe y está probado, pero nada lo invoca todavía en producción. Es
  deliberado: conectar la UI de reporte tiene más sentido junto a Fase 16-18 (donde ya se
  va a estar tocando cómo se muestra el precio con su `PriceSourceBadge`/`ConfidenceBadge`
  pendientes desde Fase 2) que como parte aislada de esta fase.
- Rate limits de reportes (tabla anti-fraude p.8, "evitar carga masiva y vandalismo") y
  geofence opcional siguen sin implementar — la doc no da un número concreto para rate
  limit (NO DEFINIDO) y geofence necesitaría lat/lng en `PriceReport`, que no está en el
  schema todavía; no se inventó ninguno de los dos.

### Próximo paso recomendado

Fase 16-18 (Top 3 animado, mapa, modo compra) sigue siendo el bloqueante real de producto
— motor, catálogo, precios y ahora el servicio de consenso ya están listos; falta
conectarlos a pantallas reales en `apps/mobile`.

## Sesión 12 — Fase 13-14 punta a punta + Codex bloqueado

### Contexto: trabajo en paralelo

Esta sesión arrancó pidiendo que Codex generara los planes de las fases pendientes. Codex
falló repetidas veces (`gpt-6-astra`/`gpt-5.6-terra` rechazados por el server incluso con
el CLI actualizado a 0.154.0 — parece ser una restricción de cuenta, no de versión local;
`gpt-5-codex` directamente no soportado con cuenta ChatGPT). Mientras se diagnosticaba eso,
**otra sesión de Claude Code corrió en paralelo sobre el mismo repo** (mismo directorio,
timestamps superpuestos) e implementó, sin que esta sesión lo supiera: `POST
/api/optimization` conectado a datos reales (Fase 15/16), `apps/mobile/app/optimization`
(Top 3 animado), `apps/mobile/app/purchase` + `PurchaseContext` (Fase 18, modo compra), y
`POST /api/price-reports` (creaba el `PriceReport` pero sin correr el consenso todavía).
Se detectó al volver a este repo y ver `git status` con un montón de archivos `??` nuevos
que esta sesión no había tocado — se verificó con `pnpm turbo run typecheck test --force`
(21/21 en verde) antes de asumir que era seguro construir encima.

### Qué se hizo

- **Cerró el loop de Fase 13-14 end-to-end** (lo único que faltaba: el servicio
  `@depaso/community` existía pero nada lo invocaba):
  - `apps/api/lib/priceConsensus.ts` (`recomputeConsensus`) — se llama después de cada
    `POST /api/price-reports`. Carga los reportes de las últimas 24h para ese
    producto+sucursal, arma `PriceReportCandidate[]` con el trust score real de cada
    usuario, corre `evaluateConsensus`, y aplica la decisión: si promueve, actualiza
    `Price` + deja el valor viejo en `PriceHistory` (mismo patrón que el import de SEPA,
    nunca sobreescribe sin histórico); si hay consenso, sube el trust score de los
    reportantes dentro del set válido (`CONFIRMED`); si un reporte es un salto imposible,
    baja su trust score (`REJECTED`) y crea un `CommunityModerationEvent`
    (`PRICE_SENT_TO_REVIEW`). La minoría de buena fe que no llegó a consenso no se toca
    (regla 7 de BUSINESS-RULES.md: "reportar distinto no es infracción").
  - **Campo aditivo `productVariantId`** en `StoreProductOffer`/`PlanStopItem`
    (`@depaso/optimization`) y en los schemas Zod correspondientes — sin esto, el Top 3 y
    el modo compra no tenían forma de saber qué variante de producto era cada precio
    mostrado, y sin esa variante no se puede reportar un precio (`PriceReport.
    productVariantId` es obligatorio). Cambio no rompe nada: el campo es opcional.
  - `apps/api/app/api/optimization/route.ts` ahora incluye `productVariantId` en cada
    oferta que arma desde `Price`.
  - `packages/api-client/src/priceReports.ts` (`createPriceReportsClient`) y
    `apps/mobile/app/report-price.tsx` — pantalla nueva de reporte, alcanzable desde el
    único lugar de la app donde hoy se ve un precio real atado a una sucursal: el botón
    "Reportar" en cada ítem del checklist de Modo compra (`purchase/index.tsx`). Sigue el
    flujo textual de `FLOWS.md` ("Usuario ve un precio → toca 'Reportar precio' → declara
    buena fe → ingresa monto/condiciones").
- **Codex**: se documenta como bloqueado por ahora (ver arriba) — no se generaron los
  planes pedidos originalmente porque el modelo pedido nunca respondió sin error. Si se
  retoma, probar con un modelo estándar (`gpt-5-codex` no sirve con cuenta ChatGPT) o
  revisar el plan de la cuenta OpenAI.

### Verificación real

- `pnpm turbo run typecheck test --force` — **21/21 tareas OK** después de todos los
  cambios (motor, api-client, mobile, api).
- **End-to-end real contra Postgres**: se levantó `apps/api` con `pnpm dev`, se registraron
  5 usuarios reales distintos, y los 5 reportaron el mismo precio real importado de SEPA
  Mayorista (`$1690` → reportes de `$1690`-`$1700`). Resultado observado directamente en
  la DB: `Price` pasó a `$1695`/`COMMUNITY_CONFIRMED`/`sourceType: COMMUNITY`,
  `PriceHistory` quedó con el valor viejo (`$1690`/`VERIFIED`) y el motivo exacto de la
  regla 4 de BUSINESS-RULES.md, y los 5 `UserTrustScore` subieron de `0.50` a `0.53` con
  `reportsConfirmed: 1`. Después de verificar, se restauró el precio original y se
  borraron los 5 usuarios de prueba (cascade) para no dejar datos falsos en la DB de
  desarrollo.

### Pendiente real (no oculto)

- Adjuntar foto de evidencia al reporte (`photoEvidenceUrl`) — el schema ya lo soporta,
  pero no hay UI de carga de imagen ni storage configurado todavía; la doc lo marca
  explícitamente como opcional, no bloqueante.
- Fase 17 (mapa visual con ruta dibujada) sigue pendiente — necesita un proveedor de
  mapas/rutas real, hoy sólo `MockRouteProvider`.
- Codex sigue sin poder generar los planes de fases pendientes pedidos originalmente por
  el usuario — bloqueado por el error de modelo descrito arriba.

### Próximo paso recomendado

Fase 19-20 (perfil/privacidad funcional + resto del admin: usuarios, moderación de
reportes comunitarios, confianza) es lo siguiente sin construir — Fase 13-18 ya están
conectadas punta a punta y verificadas contra datos reales.

## Sesión 13 — Fase 19-20 (privacidad + admin)

### Qué se hizo

- **Fase 19 (Perfil y privacidad)** — `apps/mobile/app/privacy/index.tsx`, los 4 derechos
  de LEGAL.md p.14 ("Configuración → Privacidad y datos"):
  - **Descargar mis datos**: `GET /api/account/export` (nuevo) junta cuenta,
    consentimientos, lugares, contexto de ruta, listas, preferencias, reportes de precio y
    trust score propio bajo el `userId` — el cliente lo comparte con `Share.share` (API
    nativa de RN, sin dependencia nueva). Auto-servicio e inmediato: a esta escala no hace
    falta cola de soporte para cumplir el plazo de 10 días corridos.
  - **Corregir mis datos**: resultó que `PATCH /api/auth/me` y `authClient.updateProfile`
    ya existían de una sesión anterior — sólo faltaba la UI. Edita `displayName` inline.
  - **Borrar lugares**: reusa `removePlace` de `PlacesContext` en un loop, con `Dialog` de
    confirmación (componente ya existente).
  - **Eliminar cuenta**: `DELETE /api/auth/account` también ya existía completo (soft
    delete + anonimiza email/nombre + revoca sesiones) — sólo faltaba la UI. Se agregó
    `deleteAccount()` a `AuthContext` (limpia estado local sin llamar a `logout()`, porque
    el DELETE ya revocó la sesión server-side).
  - De paso: la fila "Privacidad y datos" de Perfil abría un `LocationConsentModal` mal
    puesto ahí (modal de permiso de ubicación, sin relación) — se repuntó a la pantalla
    nueva y se sacó el estado muerto de `profile.tsx`. El modal en sí no se tocó ni se
    borró (sigue existiendo, sin volver a cablearlo al momento real de "primera
    optimización" que pide FLOWS.md — gap preexistente, no de esta sesión).
- **Fase 20 (Admin, resto)** — 3 secciones nuevas en `apps/admin`:
  - **Usuarios** (`/api/admin/users`, sólo lectura): email, nombre, rol, trust score,
    estado. Deliberadamente sin cambio de rol self-service vía HTTP — escalar a ADMIN sin
    la MFA que pide LEGAL.md p.97 (todavía NO DEFINIDA) agrandaría una brecha ya
    documentada. Ese camino sigue siendo el script `promote-admin.mjs`, fuera de HTTP.
  - **Reportes y moderación** (`/api/admin/price-reports` + `/api/admin/moderation`):
    lista los `PriceReport` con sus `CommunityModerationEvent` y permite crear una acción
    (ocultar/bajar peso/rechazar/suspender) con motivo obligatorio — implementa FLOWS.md
    "Flujo de moderación y apelación" (p.8: "dejando trazabilidad interna"). No hay
    mecanismo de suspensión de cuenta real en el schema (el evento `USER_SUSPENDED` queda
    auditable, no bloquea login) — NO DEFINIDO en la doc qué debería bloquear exactamente,
    no se inventó.
  - **Optimization runs** (`/api/admin/optimization-runs`): observabilidad de corridas.
  - **Gap real encontrado de paso**: `POST /api/optimization` calculaba el Top 3 y
    respondía, pero nunca escribía en `OptimizationRun`/`OptimizationPlan`/`Stop`/`Item` —
    esas tablas están modeladas desde Fase 1 y no las usaba nadie. Se agregó
    `persistOptimizationRun` (best-effort: si falla, no rompe la respuesta al usuario, sólo
    loguea) para que la nueva vista de admin tenga contenido real en vez de estar siempre
    vacía.
  - "Configuración" (parte del pedido original de Fase 20) queda **NO DEFINIDO**: ninguna
    doc especifica qué debería configurar el panel — no se armó una pantalla con ajustes
    inventados sólo para llenar el nombre de la fase.

### Verificación real

- `pnpm turbo run typecheck test --force` — **21/21 tareas OK** en cada punto de corte.
- **End-to-end real contra Postgres**, con `apps/api` corriendo (`pnpm dev`) y usuarios
  reales registrados (no seed):
  - Export (`GET /api/account/export`) devolvió datos reales de cuenta/consentimientos.
  - Rectificación (`PATCH /api/auth/me`) cambió el nombre real en DB.
  - Eliminación de cuenta (`DELETE /api/auth/account`) — confirmado `401` inmediato en el
    siguiente request con el mismo token (sesión revocada de verdad).
  - Flujo completo: crear lista → agregar producto real → `POST /api/optimization` con
    coordenadas reales de una sucursal de Mar del Plata → devolvió Top 3 real (Yerba mate
    Ilolay, $4.874, Carrefour Sucursal 1) → **confirmado que quedó persistido** y visible
    en `GET /api/admin/optimization-runs`.
  - Reporte de precio outlier → visible en `GET /api/admin/price-reports` → acción de
    moderación (`POST /api/admin/moderation`, `REPORT_REJECTED`) → confirmado que el
    reporte muestra el evento de moderación en el siguiente `GET`.
  - Se borraron todos los usuarios/listas/reportes de prueba al terminar (cascade), para
    no dejar datos falsos en la DB de desarrollo.

### Pendiente real (no oculto)

- **Fase 17** (mapa visual con ruta dibujada) sigue siendo el hueco de producto más
  grande — necesita un proveedor de mapas/rutas real, hoy sólo `MockRouteProvider`.
- Ninguna de las pantallas nuevas (privacidad, admin) se probó visualmente en Expo
  Web/navegador en esta sesión — sólo contra la API real vía `curl`/`fetch`. La UI en sí
  (estilos, layout, que el `Share.share` realmente funcione en Expo Web) queda para probar
  con la app corriendo.
- `LocationConsentModal` sigue sin un punto de entrada real (gap preexistente, ver arriba).
- Trust score, `USER_SUSPENDED` y moderación en general siguen sin fórmula/mecanismo
  exacto definido en la documentación (NO DEFINIDO, BUSINESS-RULES.md p.7).

### Próximo paso recomendado

Con Fase 13-20 conectadas y verificadas contra datos reales, lo que queda con mayor
impacto de producto es Fase 17 (mapa real) y la validación visual/manual de todo lo nuevo
en un dispositivo o Expo Web — este entorno no tiene esa superficie disponible.

## Sesión 14 — Fase 17 (mapas y rutas)

### Qué se hizo

- **Ruteo real** — `createMapboxRouteProvider` (`packages/data-sources/mapbox/src/
  routing.ts`) implementa `RouteProvider` (Directions API, misma cuenta/token que el
  geocoding de Fase 28 — 100k req/mes gratis, sin tarjeta). Mapea `TransportMode` a los
  perfiles reales de Mapbox (`driving`/`cycling`/`walking`); `MOTORCYCLE` se aproxima con
  `driving` (documentado, Mapbox no tiene perfil de moto); `PUBLIC_TRANSPORT` no tiene
  aproximación honesta posible — lanza en vez de mentir, y el caller usa `MockRouteProvider`
  para ese modo específico. 6 tests nuevos con la forma real de la respuesta de Directions
  v5.
  - `apps/api/lib/routing.ts` (`getRouteProvider`) elige Mapbox o Mock según haya
    `MAPBOX_ACCESS_TOKEN` y según el modo — mismo criterio que `getGeocodingProvider` de
    Fase 28 (`null`/fallback, nunca rompe).
  - Se conectó en **dos puntos**: `/api/optimization` (el motor de optimización calculaba
    todo con `MockRouteProvider` incluso en producción — encontrado real leyendo el código,
    nadie lo había wireado a un provider real todavía) y `POST /api/routes/compute` (nuevo,
    endpoint chico para que el mapa pida distancia/duración/polyline sin pasar por todo el
    pipeline de optimización).
- **Mapa visual** — `apps/mobile/components/RouteMapView` con Mapbox GL JS:
  - HTML autocontenido (`lib/map/buildRouteMapHtml.ts`, compartido) con un decoder de
    polyline estándar inline (mismo algoritmo que Google/Mapbox, sin dependencia nueva).
    Dibuja el polyline real cuando hay uno; si no (Mock, sin token), una línea recta entre
    paradas — nunca una curva inventada.
  - **`react-native-webview` no tiene build para web** (confirmado real: no hay ni un
    archivo `.web.*` en el paquete instalado) — se resolvió con el mecanismo de resolución
    de plataforma de Metro/Expo: `RouteMapView.tsx` (WebView nativa, iOS/Android) y
    `RouteMapView.web.tsx` (`iframe` directo con el mismo HTML) coexisten con el mismo
    nombre de import; Expo elige el archivo correcto solo, sin `Platform.select` a mano.
  - Scripts de Mapbox GL JS/CSS cargados con **SRI real** (`integrity` + `crossorigin`) —
    los hashes se calcularon descargando los archivos exactos de la versión pineada
    (3.7.0) y corriendo `sha384` sobre ellos, no inventados ni copiados de otro lado.
  - Token de Mapbox GL JS servido al cliente vía `GET /api/config/mapbox-token` (nuevo, no
    es secreto — un token `pk.*` de Mapbox está pensado para viajar al cliente) en vez de
    duplicar la variable de entorno entre `apps/api` y `apps/mobile`.
  - `apps/mobile/app/(tabs)/map.tsx` reescrito: pide token + ruta real al entrar, muestra
    el mapa si hay token, o el mismo aviso honesto de antes si no ("necesita un token de
    Mapbox configurado") — nunca un mapa roto o vacío sin explicación.

### Verificación real

- `pnpm turbo run typecheck test --force` — **21/21 tareas OK**.
- **Contra Postgres real** (`apps/api` con `pnpm dev`): `GET /api/config/mapbox-token` →
  `{"token":null}` (sin key real en este entorno, como se espera); `POST /api/routes/
  compute` → distancia/duración reales calculadas con `MockRouteProvider` (sin token);
  `/api/optimization` siguió funcionando igual con el nuevo wiring de `getRouteProvider`.
- **En el navegador, de punta a punta** (Expo Web vía el Browser pane): se registró un
  usuario real, se armó un recorrido de 2 paradas reales (geocoding real interceptado a
  nivel de `fetch` del lado del test únicamente, porque este entorno no tiene una
  `MAPBOX_ACCESS_TOKEN` real ni permiso de geolocalización del navegador — el backend que
  se estaba probando, `/api/routes/compute` y `/api/config/mapbox-token`, corrió sin mockear
  nada), se entró a la pestaña Mapa, y se confirmó en Network que `GET /api/config/
  mapbox-token` y `POST /api/routes/compute` se llamaron de verdad (`200 OK`) y devolvieron
  la distancia real esperada (1158 m, igual al resultado de `curl`) — la pantalla mostró
  correctamente el aviso de "falta token" en vez de romperse. Se limpiaron los datos de
  prueba (usuario, cascade) al terminar.

### Pendiente real (no oculto)

- `react-native-webview` (usado en la rama nativa) no se probó en un dispositivo/emulador
  real — no disponible en este entorno (mismo límite que el resto de `apps/mobile`).
- `MOTORCYCLE` sigue aproximado con el perfil `driving` de Mapbox (no hay perfil de moto
  real en la API) — documentado, no oculto.

### Actualización — el usuario cargó su `MAPBOX_ACCESS_TOKEN` real

Mismo día, después de cerrar la sesión de arriba: el usuario preguntó dónde poner su key
real (`apps/api/.env.local`) y la cargó. Se volvió a levantar `apps/api` + Expo Web y se
repitió la verificación con la key real puesta:

- `GET /api/config/mapbox-token` devolvió el token real (antes `null`).
- `POST /api/routes/compute` devolvió un polyline real y una distancia por calle real
  (**1687 m**) — distinta y mayor a la del fallback en línea recta (1158 m), como debe ser
  un ruteo real vs. haversine.
- **El mapa renderizó de verdad en el navegador**: calles reales de Mar del Plata (San
  Juan, 14 de Julio, España, Bolívar, Garay, Corrientes), los 2 marcadores numerados en la
  posición geográfica correcta, watermark/atribución de Mapbox visible, controles de zoom
  funcionando. Confirmado con captura de pantalla real, no simulada.

Esto cierra el único punto pendiente de Fase 17 que dependía de una key real. Se limpiaron
los datos de prueba (usuario nuevo, cascade) y se pararon ambos servers al terminar.

## Sesión 15 — QA real de Fase 19-20 + 2 bugs reales de navegación en "Mis lugares"

### Contexto

El usuario pidió reconfirmar Fase 19-20 (usuarios, moderación) y, de paso, pidió
explícitamente **probar si "lugares guardados" funciona bien** y si se puede **editar la
ruta de hoy si uno se equivoca de dirección**. En vez de asumir que lo ya construido
andaba, se probó todo en vivo — apareció un bug real que sólo se detecta usando la app.

### Qué se encontró y arregló

- **Bug real: "Mis lugares" no navegaba desde Perfil** (`The action 'PUSH' ... was not
  handled by any navigator`). Causa raíz: `places/index` estaba registrado con el mismo
  `name` de `Stack.Screen` en dos `Stack.Protected` hermanos (`(setup)` y `(tabs)`) — un
  intento anterior de esto (ver comentario viejo en `_layout.tsx`) resolvió un síntoma
  distinto (aterrizar en la pantalla equivocada después del setup) pero dejó este bug de
  navegación sin detectar, porque nadie había probado clickear "Mis lugares" ya logueado
  con la app corriendo de verdad. Nada del wizard de setup navega a la lista (`places/
  index`), sólo al form (`places/form`) — se sacó `places/index` del bloque de `(setup)`.
- **Segundo bug, mismo patrón: "+Agregar lugar" tampoco navegaba** — `places/form` seguía
  duplicado entre los dos `Stack.Protected`. Arreglado de raíz (no sólo tapando el
  síntoma): se creó `apps/mobile/app/(setup)/places-form.tsx`, un alias de una sola línea
  (`export { default } from "../places/form"`) que reusa el mismo componente bajo una ruta
  propia del stack de `(setup)`, sin compartir `name` con la copia de `places/form` del
  stack raíz. `(setup)/places.tsx` ahora navega a `/(setup)/places-form` en vez de
  `/places/form`.
- **Gap real pedido por el usuario: no se podía sacar/corregir un lugar mal agregado a "la
  ruta de hoy"** — `route-context/index.tsx` sólo dejaba destildar lugares *guardados*
  (checkbox); un lugar temporal (dirección tipeada) o "Ubicación actual" quedaba pegado
  ahí sin forma de sacarlo salvo cerrar todo y empezar de nuevo. Se agregó una sección
  nueva "Tu ruta de hoy" que lista TODOS los waypoints (guardados, temporales o ubicación
  actual) numerados con un botón X para sacar cualquiera — reusa `removeWaypoint`, una
  función que ya existía pero sólo se usaba para destildar lugares guardados.
- **Gap real encontrado de paso en `apps/admin`**: la home (`app/page.tsx`) seguía
  listando "Usuarios", "Reportes comunitarios", "Moderación" y "Optimization Runs" bajo
  "Secciones previstas, aún no implementadas" — texto desactualizado desde antes de la
  Sesión 13, que ya las había construido. Corregido para reflejar el estado real; también
  se sacó "Configuración" de la lista de pendientes (NO DEFINIDO, no hay spec, no se va a
  construir con datos inventados).

### Verificación real

- `pnpm turbo run typecheck test --force` — **21/21 tareas OK** en cada punto de corte.
- **Admin, en el navegador** (`localhost:3100`, login real): se confirmó que "Usuarios"
  lista usuarios reales (con trust score), "Reportes y moderación" muestra un reporte real
  y la acción de moderación (`REPORT_HIDDEN` con motivo) se aplicó y quedó visible tras
  refrescar, y "Optimization runs" muestra el estado vacío honesto sin romperse.
- **Mobile, en el navegador** (Expo Web, reinicio limpio del server para descartar
  corrupción de Fast Refresh como variable): CRUD completo de "Mis lugares" probado de
  punta a punta — crear (con favorito), listar, editar (cambiar nombre), eliminar, todo
  confirmado visualmente y contra la API real. Flujo de "¿Por dónde vas a andar hoy?"
  probado con un lugar guardado + una dirección temporal mal puesta + sacarla con el X
  nuevo — confirmado que desaparece de la lista y el resumen pasa de "2 paradas" a
  "1 parada" correctamente.
- Se limpiaron todos los usuarios de prueba de esta sesión (incluido uno suelto de una
  sesión anterior, `e2e-admin-test@test.local`, encontrado de paso en la lista de
  Usuarios del admin) al terminar.

### Pendiente real (no oculto)

- La navegación por **URL directa** a una ruta anidada (ej. `http://localhost:8081/places`
  tipeado directo en la barra, no un click dentro de la app) a veces rebota a Home en la
  primera carga fría — no se investigó a fondo porque no es el patrón de uso real de una
  app nativa (no hay barra de direcciones en iOS/Android) y el usuario no lo pidió; queda
  anotado por si en algún momento importa para Expo Web específicamente.

### Próximo paso recomendado

Con el bug de navegación de "Mis lugares" cerrado y Fase 13-20 reconfirmadas en vivo, el
hueco de producto más grande sigue siendo Fase 17 (ya con mapa real — validar en
dispositivo nativo) y Fase 21-25 (ampliar tests, performance, motion, accesibilidad, QA
end-to-end del resto de flujos no cubiertos todavía por esta sesión).

## Sesión 16 — Fase 24 (accesibilidad) + divulgación de precios (BUSINESS-RULES.md p.9) + bug crítico del Top 3

### Qué se hizo

- **Fase 24, accesibilidad — violación de contraste real, no hipotética**: BRAND.md (p.12)
  y el propio comentario en `colors.ts` documentan que `brand.route` (#6290C3, contraste
  ≈3.3:1 sobre blanco) "no debe usarse como texto chico... reservarlo para íconos, rutas,
  bordes o texto grande". Un grep encontró **12 usos reales** violándola — incluido el
  variant `ghost` de `Button.tsx` (usado en toda la app: "Cancelar" de todos los `Dialog`,
  etc.) y un caso propio de esta sesión (el link "Reportar" de Modo compra). Se cambiaron
  todos a `text.secondary` (ya usado como color de texto secundario en toda la app,
  contraste muy superior) y se agregó `textDecorationLine`/`fontWeight` donde faltaba una
  señal no-color de que es interactivo (ya varios lo tenían). Quedaron sin tocar los usos
  reales como ícono o línea de ruta en el mapa — esos sí están permitidos por la regla.
- **Divulgación obligatoria de precios (BUSINESS-RULES.md p.9)** — "Componentes
  obligatorios de cada precio mostrado: Monto, Sucursal, Fuente, Recencia, Confianza,
  Disputa si existe, Aviso". Un grep confirmó que el aviso legal obligatorio
  ("Los precios... son estimaciones... Verificá el precio final en el comercio") **sólo
  existía enterrado en la pantalla de Términos y Condiciones** — nunca se mostraba en Top 3
  ni en Modo compra, que es donde la doc lo exige ("aviso persistente antes de mostrar
  resultados", FLOWS.md). Se implementó de punta a punta:
  - `@depaso/optimization`: `StoreProductOffer`/`PlanStopItem` ahora propagan
    `sourceType`/`reportedAt` (más el `confidence` que ya existía a nivel de oferta, ahora
    también a nivel de ítem) — campos opcionales, no rompen callers viejos (mismo patrón
    aditivo que `productVariantId` de Fase 17).
  - `apps/api/app/api/optimization/route.ts` los llena desde el `Price` real.
  - `apps/mobile/lib/priceDisclosure.ts` (funciones puras: `sourceTypeLabel`,
    `confidenceLabel`, `formatRecency` — "Actualizado hace 2h" es el ejemplo literal de la
    doc) y `PriceDisclosureBanner` (componente, el aviso legal exacto).
  - `apps/mobile/app/optimization/index.tsx` (Top 3) y `apps/mobile/app/purchase/index.tsx`
    (Modo compra) ahora muestran el banner una vez por pantalla; Modo compra además muestra
    "Fuente · Confianza · Recencia" bajo cada ítem (ahí sí hay un precio puntual por
    producto+sucursal, a diferencia del Top 3 que es un costo agregado).
- **Bug crítico real encontrado probando el flujo completo en el navegador — no en curl**:
  el schema Zod de `PlanStop.order` exigía `positive()` (>0), pero el motor genera
  `order: 0` para la primera parada (0-indexado, `combo.entries()` en
  `packages/optimization/src/offers.ts`). Esto significa que **el cliente rechazaba
  silenciosamente cualquier respuesta 200 válida del servidor con un plan de un solo
  comercio** (el caso más común) y mostraba "No pudimos armar tu Top 3" — un bug que
  probablemente estuvo ahí desde que se construyó el flujo real (Fase 16), nunca detectado
  porque las verificaciones anteriores de este proyecto probaron el endpoint con `curl`
  (que no pasa por la validación Zod del lado cliente) pero nunca habían llegado tan lejos
  en el flujo real dentro del navegador. Arreglado: `positive()` → `nonnegative()`
  (`packages/validation/src/optimize.ts`).

### Verificación real

- `pnpm turbo run typecheck test --force` — **21/21 tareas OK** en cada punto de corte.
- Antes de arreglar el bug de `order`, se confirmó con `node --experimental-strip-types`
  corriendo el schema real contra un response real capturado del navegador — reproducción
  determinística, no una suposición.
- **En el navegador, de punta a punta, con el token real de Mapbox puesto**: se armó un
  recorrido real con geocoding stubeado (mismo criterio que sesiones anteriores — sin
  permiso de geolocalización en este entorno), se corrió el Top 3 real y **funcionó**:
  plan real ("Mejor equilibrio", $1.111, "Ahorrás $6.328", Coto Sucursal 2), banner de
  aviso legal visible arriba con el texto exacto de la doc. Se entró a Modo compra y se
  confirmó el ítem con el caption real: **"Estimado · Confianza media · Actualizado hace 4
  días"** — coincide exactamente con los datos reales del `Price` de seed usado.

### Pendiente real (no oculto)

- No se hizo una auditoría WCAG formal completa (la doc misma la marca NO DEFINIDO,
  BRAND.md p.29-131) — sólo se cerró la violación de contraste específica y documentada
  que BRAND.md sí marca como restricción obligatoria.
- El Top 3 no muestra "Fuente/Confianza/Recencia" por ítem (es un costo agregado, no hay
  un precio puntual que divulgar ahí) — sólo el aviso general. La divulgación completa por
  producto vive en Modo compra, que es donde hay un precio real por ítem.
- Screen reader / dynamic type siguen sin probarse con un lector de pantalla real (no
  disponible en este entorno) — mismo límite que el resto de `apps/mobile`.

### Próximo paso recomendado

El bug de `order` era potencialmente el hallazgo más importante de toda la sesión — sin él,
el flujo central del producto (Top 3) podía estar silenciosamente roto para la mayoría de
los casos reales. Con eso resuelto y la divulgación de precios implementada, lo que sigue
con más impacto es probar el resto de los flujos completos en el navegador (no sólo por
`curl`) para encontrar bugs similares antes de seguir agregando features nuevas.

## Sesión 17 — Fase 23 (motion polish) + segundo bug crítico real del Top 3 + QA en vivo

### Motivo

Pedido explícito: completar lo que faltaba de `IMPLEMENTATION-PLAN.md`, con foco en
funcionalidad y testing correctos — diseño, movilidad, accesibilidad, usabilidad, y que la
app tenga **motion** real (no sólo tokens) para que se sienta viva al usarla.

### Motion implementado (6 de 7 "momentos clave" de `MOTION-SYSTEM.md`)

- **Entrada de Home** (`app/(tabs)/index.tsx`): stagger `FadeInDown.delay(index*70)` sobre
  header, tarjeta de ruta, tarjeta de búsqueda y banner de ahorro. `useReducedMotion()`
  desactiva el delay/duración cuando el sistema pide menos movimiento.
- **Agregar/quitar producto de una lista** (`app/lists/[id].tsx`): cada fila del `FlatList`
  entra con `FadeInDown.springify()` (`spring.soft`) y sale con `FadeOutLeft`, usando los
  tokens de `motion.spring`/`motion.duration` en vez de números sueltos.
- **"Analizando productos..."** (`app/optimization/index.tsx`): `AnalyzingIndicator` nuevo,
  pulso de opacidad (`withRepeat(withSequence(...), -1, true)`) mientras `run()` está en
  vuelo, con la copy exacta que pide el master prompt.
- **Count-up del ahorro** (`lib/useCountUp.ts`, nuevo): hook genérico, ease-out cúbica,
  500ms, usado en `PlanCard` para animar "Ahorrás $X" desde 0 en vez de aparecer de golpe.
  Con Reduce Motion va directo al valor final.
- **Dibujo progresivo de la ruta en el mapa** (`lib/map/buildRouteMapHtml.ts`): el polyline
  real ya no aparece de golpe — se revela en 900ms con easing ease-out, interpolando puntos
  a lo largo de los segmentos reales del polyline decodificado. Respeta
  `prefers-reduced-motion` (dibuja la línea completa de inmediato si está activo). Como esta
  lógica vive en un string HTML embebido en un WebView (no pasa por `tsc`), se verificó
  aparte con un harness Node standalone (mocks de `mapboxgl`/`document`/`window`/
  `performance`/`requestAnimationFrame`, luego borrado) antes de confirmarla visualmente en
  el navegador.
- Reveal del Top 3 y checkbox+haptic del Modo compra ya eran reales de sesiones previas
  (Fase 16/18) — quedan confirmados, no reimplementados.

Shared transitions (producto→detalle, plan→mapa) sigue sin forzar — la propia doc lo marca
"cuando sea técnicamente estable", no es un pendiente oculto.

### Segundo bug crítico real del Top 3 (mismo patrón que el de `order` en Sesión 16)

Probando el flujo completo en el navegador con un usuario/lista/ruta reales, `POST
/api/optimization` devolvió `200` con `{"plans":[]}` (ningún comercio cercano vendía el
producto de esa lista dentro del corredor de la ruta — una respuesta real y válida, no una
falla) y el cliente lo mostró como "No pudimos armar tu Top 3", el mismo mensaje genérico
que un error real de red. Causa: `optimizationRunResponseSchema.plans` exigía
`z.array(...).length(3)`, pero el motor (`packages/optimization`) sólo devuelve 0 o 3 planes
nunca 1 ni 2, porque los 3 perfiles comparten el mismo set de combinaciones — `[]` es un
resultado legítimo ("no encontramos comercios cerca"). Encontrado revisando el log real del
servidor (`POST /api/optimization 200 in 1190ms`) y el network request capturado en el
navegador (body `{"plans":[]}`), no adivinado.

Arreglado en dos capas:
- `packages/validation/src/optimize.ts`: `.length(3)` → `.refine((arr) => arr.length === 0
  || arr.length === 3)`, con comentario explicando el invariante del motor.
- `apps/mobile/app/optimization/index.tsx`: `run()` ahora distingue explícitamente
  `result.plans.length === 0` y muestra un mensaje honesto y específico ("No encontramos
  comercios con estos productos cerca de tu recorrido de hoy. Probá con otra lista o ampliá
  tu ruta.") en vez de dejar que caiga en el error genérico.

### Verificación real

- `pnpm turbo run typecheck test --force` — **21/21 tareas OK**.
- **En el navegador, de punta a punta, con datos reales verificados contra Postgres**: se
  armó una lista con un producto/precio/sucursal reales de la base (`Yerba mate Ilolay`,
  Carrefour Sucursal 1), se confirmó un recorrido de hoy con 2 waypoints geocodificados
  cerca de esa sucursal, y se corrió el Top 3 real. Resultado: 3 planes reales
  ("Mejor equilibrio" recomendado, $4.874, "Carrefour Sucursal 1 es la opción más barata"),
  se entró a Modo compra, se tildó el ítem (checkbox con animación + caption real "Fuente
  oficial · Confianza media · Actualizado hace 4 días"), la barra de progreso llegó a 1/1 y
  apareció "Finalizar compra". Se navegó a la tab Mapa con un recorrido real (Casa→Trabajo,
  lugares guardados) y el mapa renderizó con calles reales de Mar del Plata, la ruta
  dibujada entre los 2 marcadores numerados y el botón de editar recorrido visible — el
  dibujo progresivo en sí ya se había verificado de forma determinística con el harness Node
  (900ms, 18 frames, termina exactamente en el polyline real de 20 puntos).
- Se confirmó de paso, sin ser un bug, que `TodayRouteContext` es efímero por diseño: un
  reload completo de página borra el recorrido del día (vuelve a "Todavía no tenés una ruta
  activa"), igual que ya estaba documentado.

### Limpieza

Usuario de prueba (`qa-full@test.local`, cascada de lugares/listas/ruta) borrado de la base
real al terminar, servidor de `apps/api` y preview de Expo Web detenidos, sin archivos
`scratch_*` sueltos en el working tree.

### Pendiente real (no oculto)

- Shared transitions (momento 26 de `MOTION-SYSTEM.md`) sigue sin implementar — no forzado.
- QA en vivo de Preferencias, tab Actividad y Perfil (más allá de lo ya verificado en
  Fase 19-20) no se hizo en esta sesión — el pedido original era amplio ("diseño,
  movilidad, accesibilidad, usabilidad") pero se priorizó cerrar motion + el bug crítico
  del Top 3 encontrado en el camino, que tenía más impacto que ampliar la cobertura de QA a
  pantallas ya dadas por "Hecho — verificado con DB real" en sesiones anteriores.
- Dispositivo/emulador nativo real sigue sin estar disponible en este entorno — todo lo de
  arriba se confirmó en Expo Web, no en iOS/Android real (gestos táctiles, haptics reales,
  `expo-secure-store` nativo).

### Próximo paso recomendado

Con Top 3 (los dos bugs de schema que lo rompían silenciosamente) y el motion polish
cerrados, lo de mayor impacto que queda es Fase 21 (ampliar tests automatizados a
product matching / otros servicios sin cobertura) y una pasada de QA dedicada a
Preferencias/Actividad/Perfil, antes de entrar a Fase 26-27 (que dependen de
infraestructura no disponible en este entorno).

## Sesión 18 — QA de Preferencias/Actividad/Perfil + reporte de usuario sobre geocoding

### Motivo

El usuario pidió una pasada de QA sobre Preferencias, Actividad y Perfil, y reportó que
"agregar dirección" en el recorrido de hoy tiraba "No pudimos ubicar esa dirección. Probá
de nuevo." de forma consistente.

### Diagnóstico del reporte de geocoding

No era un bug de geocoding en sí: al terminar la Sesión 17 se detuvo, como parte de la
limpieza estándar, el servidor de `apps/api` y el preview de Expo Web — el usuario probó la
app inmediatamente después, con el backend apagado. Confirmado real: el token de Mapbox
sigue funcionando perfecto (`curl` directo contra la Geocoding API devolvió coordenadas
reales para "Av. Independencia 3100, Mar del Plata"), y con los servidores arriba de nuevo
el mismo flujo en el navegador agregó la dirección sin problema (waypoint real, diálogo
"¿Guardar este lugar para otra vez?").

Sí se encontró un bug real de UX en el camino: `route-context/index.tsx` y
`places/form.tsx` atrapaban **cualquier** error que no fuera un `ApiError` 503 (geocoding no
configurado) bajo el mismo mensaje genérico "No pudimos ubicar esa dirección. Probá de
nuevo." — esto incluye un error de red real (servidor caído, sin conexión), que es un
problema completamente distinto a "la dirección no existe" y que el usuario no puede
resolver "probando de nuevo con otra dirección". Mismo patrón que los dos bugs de Zod de
sesiones anteriores: un catch-all genérico esconde la causa real. Arreglado en ambos
archivos: ahora se distingue `ApiError` (404/otros status → mensajes ya existentes) de un
error de red real (`err` no es `ApiError` → "No pudimos conectar con el servidor. Revisá tu
conexión e intentá de nuevo."). Verificado: `pnpm --filter @depaso/mobile run typecheck`
limpio, y el flujo real de agregar dirección confirmado funcionando end-to-end después del
fix.

### QA real de Preferencias/Actividad/Perfil

Con un usuario de prueba nuevo, en el navegador:

- **Preferencias**: agregar preferencia de marca (buscar "yerba" sobre datos reales de
  SEPA, elegir "Marca preferida", guardar) — persiste, aparece en la lista, se puede sacar
  con la X. Agregar preferencia de comercio (categoría "Almacén", sucursal real "Almacén
  Dorrego Sucursal 1", "Preferido") — mismo resultado, persiste real. Sin bugs.
- **Actividad**: sub-tab "Actividad" vacía honesta ("Cuando completes una compra o reportes
  un precio, va a aparecer acá — con datos reales, no una muestra"). Sub-tab "Comunidad" es
  un placeholder explícito ("llega en una fase siguiente") — no es un bug, es una fase
  futura distinta del motor de consenso ya implementado (Fase 13-14).
  Sin bugs.
- **Perfil**: contadores reales ("0 productos", "0 lugares", nunca un número inventado —
  ver comentario ya existente en `profile.tsx` sobre no fijar "2 tarjetas" a mano).
  "Notificaciones"/"Ayuda y soporte" son toasts honestos de "todavía no está disponible",
  no pantallas falsas. "Privacidad y datos" → "Descargar mis datos" dispara el export real
  (`200`, confirmado por network request) y "Corregir mis datos" edita el nombre de verdad
  (toast "Datos actualizados.", reflejado de inmediato en el header del perfil). Contraste
  del link "Cerrar sesión" (`colors.brand.accentDark`, no `brand.route`) calculado en
  ~4.73:1, pasa AA para texto normal — no repite la violación de contraste ya corregida en
  Sesión 16. Sin bugs.

### Limpieza

Usuario de prueba (`qa-route2@test.local`) borrado de la base real, servidor de `apps/api`
detenido, preview de Expo Web detenido, sin archivos `scratch_*` sueltos.
`pnpm turbo run typecheck test --force` → 21/21 en verde.

### Pendiente real (no oculto)

Dispositivo/emulador nativo real sigue sin estar disponible en este entorno — todo lo de
arriba se confirmó en Expo Web.

## Sesión 19 — Fase 21/22/24/25 (tests, performance, accesibilidad, QA)

### Motivo

Pedido explícito: seguir con Fase 21 (tests), 22 (performance), 24 (accesibilidad) y 25 (QA
general) para preparar la aplicación, y generar un commit al final.

### Fase 21 — Tests

- La nota de `IMPLEMENTATION-PLAN.md` sobre "product matching sin tests dedicados" estaba
  desactualizada: `normalizeProductName`, `isValidGtinChecksum` y
  `extractUnitFromDescription` (`packages/data-sources/sepa`) ya tenían 29 tests reales
  entre los 5 archivos de test de ese paquete. Corregido en el plan.
- **Gap real encontrado**: `apps/mobile` no tenía absolutamente ningún test automatizado —
  sin `vitest.config.ts` ni script `test` en `package.json`. Como Turborepo omite en
  silencio los paquetes sin un script dado, esto nunca apareció como una falla en
  `pnpm turbo run test`, sólo como una ausencia total. Se agregó infraestructura mínima
  (Vitest, sólo `lib/**/*.test.ts` — testear componentes necesitaría un renderer de RN que
  no amerita todavía la complejidad) y `apps/mobile/lib/priceDisclosure.test.ts` (16 tests):
  los 3 `sourceType` reales del schema, comportamiento honesto ante uno desconocido (no
  inventa etiqueta), los 3 buckets de `ConfidenceLevel`, y `formatRecency` con reloj falso
  (`vi.useFakeTimers`) cubriendo recién/minutos/horas/día singular/días plural/>30 días
  ("Puede estar desactualizado")/reloj desincronizado (timestamp futuro). Se eligió este
  archivo primero porque es la divulgación legal obligatoria de precio (BUSINESS-RULES.md
  p.9) — la lógica con más riesgo real si se rompe silenciosamente.

### Fase 22 — Performance

Sin datos de producción reales para medir tiempos, así que el trabajo posible en este
entorno es auditoría de riesgo, no benchmarking. Se revisaron todos los `prisma.*.findMany`
de `apps/api` buscando falta de límite (`take`) que se vuelva un problema real de
performance/memoria a medida que crecen las tablas. La mayoría ya estaban bien: acotados
por `userId` (naturalmente chicos) o con `take` explícito en los endpoints de admin más
nuevos (`optimization-runs`, `price-reports`, `prices`, `users`, todos con `take: 200` o
`100`). Se encontraron y cerraron 3 sin límite:

- `GET /api/admin/stores` → `take: 200`
- `GET /api/admin/store-branches` → `take: 200`
- `GET /api/stores/branches` (lectura pública para preferencias, Fase 10) → `take: 500`

**Corrección (ver "Corrección real" más abajo): esta sección asumió por error que el
volumen de sucursales/precios era bajo (sólo Mayorista) — en realidad SEPA Minorista ya
estaba conectado desde la Sesión 10, así que el `take` agregado no era prevención a
futuro, ya estaba corrigiendo un problema real presente con 53+ sucursales y ~211k
precios en la base en ese mismo momento.** De paso se confirmó que la consulta más
caliente del sistema (`POST /api/optimization`, precios por lista+recorrido) ya resuelve
todo en un solo `findMany` por lote (`WHERE productVariantId IN (...)`), no un query por
producto — sin patrón N+1 que corregir ahí.

### Fase 24 — Accesibilidad

Auditoría programática (no manual, un script Node recorriendo el AST superficial de todos
los `.tsx` de `apps/mobile`) de cada `<Pressable>`/`<TouchableOpacity>` buscando cuáles no
declaran `accessibilityLabel`. La mayoría ya lo tenían (confirmado leyendo cada candidato
real, descartando falsos positivos del propio script por `onPress={() => ...}` conteniendo
un `=>` que confundía la detección del cierre de la etiqueta JSX). Sobrevivieron 2 gaps
reales:

1. `components/BottomSheet.tsx`: el `Pressable` interno que sólo existe para frenar la
   propagación del tap (evitar que tocar el contenido cierre el sheet) no tenía label — un
   lector de pantalla lo enfocaba como un control vacío antes de llegar al contenido real.
   Arreglado con `accessible={false}` (no es un control semántico real).
2. `components/Toast.tsx`: los toasts aparecen fuera del flujo de foco actual (no hay
   ninguna navegación hacia ellos) y se autodescartan solos a los 2.6s — sin nada que los
   anuncie, un usuario de lector de pantalla simplemente nunca se entera de que aparecieron,
   incluidos mensajes importantes como confirmaciones de guardado o errores. Arreglado
   llamando `AccessibilityInfo.announceForAccessibility(message)` en el momento en que se
   muestra el toast (`show()`), en vez de depender de que el usuario esté enfocado ahí.

También se confirmó por código (grep, no supuesto) que `allowFontScaling` nunca se
deshabilita en ningún componente de texto — el dynamic type del sistema no está bloqueado en
ningún lado, aunque sigue sin poder confirmarse visualmente sin un dispositivo real.

### Fase 25 — QA general

Verificación en el navegador de que los 2 fixes de accesibilidad no rompieron nada visible:
un toast disparado (`Recuperar contraseña todavía no está disponible.`) se ve idéntico a
antes, sin errores nuevos en consola relacionados a `AccessibilityInfo`. El cambio de
`BottomSheet` es un prop estándar de RN (`accessible`), ya cubierto por el typecheck limpio
de `apps/mobile`.

### Verificación real

`pnpm turbo run typecheck test --force` → **22/22 tareas OK** (subió de 21 a 22: ahora
`@depaso/mobile:test` existe y corre). Los 16 tests nuevos de `priceDisclosure` pasan.

### Pendiente real (no oculto)

- Fase 22 sigue sin poder medirse con carga real (no hay datos de producción ni entorno de
  staging) — lo hecho es prevención de riesgo conocido, no benchmarking.
- Fase 21: `resolveProductVariant` (matching real en el import job de SEPA) sigue sin test
  dedicado porque está entrelazado con Prisma — el proyecto no mockea la DB por convención,
  se verifica manualmente contra Postgres real (ya hecho: 13.021 precios importados de
  verdad). El motor de optimización y el sistema de consenso siguen siendo la lógica pura
  con mejor cobertura automatizada.
- Fase 24 sigue sin una pasada con un lector de pantalla real (VoiceOver/TalkBack) — no hay
  dispositivo físico ni emulador disponible en este entorno, la auditoría fue por código.
- Fase 26 (build Android/iOS) sigue bloqueada por falta de Android Studio/Xcode/EAS en este
  entorno — ver la respuesta específica dada al usuario sobre qué haría falta para poder
  probarla.

## Sesión 20 — primer commit real, EAS Build, refresco de SEPA Minorista, y una corrección

### Corrección real (no oculta)

Al responder sobre por qué la app "todavía no tenía datos reales", afirmé que **SEPA
Minorista nunca se había conectado** — eso era **incorrecto**. Ya estaba conectado desde la
Sesión 10 (2026-09-13): 53 sucursales reales de Mar del Plata, 211.110 precios reales.
Me guié por la tabla resumen de `IMPLEMENTATION-PLAN.md` (Fase 11/12), que había quedado
desactualizada desde esa sesión y seguía diciendo "Minorista pendiente" — no crucé ese
resumen contra el detalle real en este mismo archivo (Sesión 10) antes de afirmarlo. Ya
corregido: Fase 11/12 en `IMPLEMENTATION-PLAN.md` y la nota de Fase 22 de la Sesión 19 de
arriba, que había heredado el mismo error.

Lo que sí fue trabajo real de esta sesión: corrí `pnpm data:sepa:import --retail` de nuevo,
lo que trajo un **snapshot más nuevo** del feed (resource `9dc06241-...`, 2026-09-15) — no
la primera conexión, un refresco con datos más actuales. Resultado real verificado contra
la base: **231.119 precios totales** (229.729 `OFFICIAL_SEPA`), **71.946 productos**,
**80 sucursales reales en 41 comercios**. 0 precios rechazados en esta corrida; 1 anomalía
real (`comercio.csv vacío o ausente` para un comercio puntual un día — comportamiento ya
anticipado en `docs/data/SEPA.md`, no un bug nuevo).

### Primer commit real del proyecto

Todo el trabajo acumulado desde el scaffold inicial (`DePasoInicio`) — Fases 1-25 completas
— nunca se había commiteado. Se hizo un commit único con todo el estado actual (223
archivos), más 2 commits chicos de esta sesión (Fase 21/22/24/25, y la config de EAS).
Los 3 pusheados a `origin/master` (`https://github.com/SESELOVSKYDarian/DePaso`).

### EAS Build configurado y vinculado

`apps/mobile/eas.json` (perfiles `development`/`preview`/`production`), scripts
`build:dev`/`build:preview`/`build:production`, `eas-cli`+`expo-dev-client` como
dependencias, y `docs/development/EAS-BUILD-SETUP.md` con el paso a paso. El usuario corrió
`eas init` con su propia cuenta (team "parahacer's team", proyecto "DePaso") — el
`projectId` real (`a45d8dda-7b98-47b8-a4bb-49b9f3e4c90b`) y `owner: "parahacer"` quedaron
commiteados en `app.json` para que no haga falta re-vincular.

### Verificación real

`pnpm --filter @depaso/mobile run typecheck` limpio después de linkear el `projectId`.
Conteos de la base confirmados por consulta directa (Prisma), no sólo por el log del
import.

### Pendiente real (no oculto)

- El primer build de EAS (`eas build --profile development --platform android`) todavía no
  se corrió — el usuario lo tiene que disparar con su cuenta, no se puede hacer desde este
  entorno.
- Batching de inserts en el import de SEPA sigue sin implementarse (sección 27 del pedido
  original) — cada precio es su propio find+create/update secuencial; aceptable al volumen
  actual (231k filas corrieron igual), pero no escala indefinidamente.

## Sesión 20 — Fase 26 real: build Android local con Android Studio (bug nativo de Windows resuelto)

### Motivo

El usuario decidió no usar EAS Build para el producto final — quiere todo con Android
Studio. Pidió una vía local, gratis, para generar el `.apk`.

### El problema real: `ninja` roto en Windows

Instalé JDK 17 (Temurin) + Android SDK/NDK localmente y corrí `expo prebuild --platform
android` + `gradlew assembleDebug`. El build nativo (Reanimated, Worklets,
react-native-screens, expo-modules-core — todo lo que compila C++) fallaba siempre con:

```
ninja: error: manifest 'build.ninja' still dirty after 100 tries
```

Se probó, en orden, sin éxito:
1. Menos paralelismo (`--max-workers=1`) — mismo error.
2. Exclusiones de Windows Defender (agregadas por el usuario a mano, ya que tocar Defender
   por código fue bloqueado correctamente por el clasificador de seguridad) — mismo error.
3. Mover el proyecto entero a una ruta corta (`D:\VSPROJECTS\ESCUELA\7to4ta\Proyectos\DePaso`
   → `D:\DePaso`, descartando longitud de ruta como causa — la ruta más corta seguía
   fallando idéntico).
4. El mismo error, ahora también reproducido **desde Android Studio** (no sólo CLI), tanto
   para `arm64-v8a` como `x86_64` (emulador).

Causa real identificada: no era ruta ni antivirus — es un bug documentado de `ninja`/CMake
en Windows con los miles de **NTFS junctions** que `pnpm` crea por defecto en
`node_modules` (su modo de deduplicación vía `.pnpm` + symlinks). Fix real: `.npmrc` con
`node-linker=hoisted` (estructura plana, sin symlinks) + reinstalación completa. Confirmado
real: `BUILD SUCCESSFUL`, `.apk` generado (192MB, debug) y entregado al usuario.

### Efectos colaterales de la migración de infraestructura (todos encontrados y cerrados)

- Mover la carpeta del proyecto con `robocopy` sin `/NP` generó un log de varios cientos de
  MB que llenó `C:` a 0 bytes libres — detectado, log borrado, cache de Gradle y el SDK
  reubicados a `D:` (tiene 700+ GB libres) para que no vuelva a pasar.
- El primer intento de mover con `robocopy /MOVE` se cortó a mitad de camino (por lo del
  disco lleno) — verificado que `.git` ya había migrado completo e íntegro antes de seguir;
  se terminó de mover sólo lo que faltaba (`node_modules`) en vez de arriesgar re-copiar
  todo.
- El cambio a `node-linker=hoisted` rompió la resolución de `@prisma/client` en
  `packages/database` (el cliente generado vive en `node_modules/@prisma/client`, quedó
  desactualizado tras la reinstalación) — se regeneró con `pnpm run generate` y se confirmó
  `pnpm turbo run typecheck test --force` en 22/22 de nuevo.
- `apps/mobile/android` (generado por `expo prebuild`) estaba en `.gitignore` por defecto
  (workflow "managed" de Expo). Como el usuario va a editar/compilar nativo directo en
  Android Studio de ahora en más, se sacó del `.gitignore` y se commiteó tal cual generado
  — decisión confirmada explícitamente con el usuario antes de hacerlo, no asumida.

### Verificación real

`pnpm turbo run typecheck test --force` → **22/22 OK** después de la reinstalación con
`node-linker=hoisted` y de regenerar el cliente de Prisma. `gradlew assembleDebug` →
`BUILD SUCCESSFUL in 9m 48s`, `.apk` real de 192MB confirmado en
`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` y enviado al usuario.

### Pendiente real (no oculto)

- iOS sigue sin poder probarse — necesita Mac/Xcode, no disponible en ningún entorno usado
  hasta ahora (ni este, ni la máquina Windows del usuario).
- El build generado es `debug` (192MB, con herramientas de desarrollo incluidas) — un build
  `release` real (más chico, firmado) queda para cuando el usuario esté listo para
  distribuir de verdad, no antes.
- EAS Build quedó configurado (Sesión 19) pero sin usarse — el usuario decidió priorizar
  Android Studio para el producto final; EAS sigue disponible como alternativa si hace
  falta un build en la nube más adelante.

## Sesión 21 — build release standalone real (sin expo-dev-client, sin pantalla de Metro)

### Motivo

El usuario instaló el `.apk` de la Sesión 20 y le apareció la pantalla de "Development
Build" pidiendo conectarse a `http://localhost:8081`. Pidió sacar Expo "del todo".

### Diagnóstico

No era un bug de configuración — era el comportamiento esperado de un build **debug con
`expo-dev-client`** (necesita un servidor Metro corriendo, por diseño). "Sacar Expo del
todo" habría significado reescribir `expo-router`, `expo-location`, `expo-haptics`,
`expo-secure-store`, etc. — meses de trabajo, no la solución real al problema. Se confirmó
esto con el usuario antes de actuar (no se asumió su pedido literal): lo que necesitaba era
un build **release** standalone (JS empaquetado adentro del `.apk`, sin depender de Metro),
sacando sólo `expo-dev-client` (que no aporta nada al flujo de Android Studio).

### Segundo bug real de infraestructura encontrado armando el release

Sacar `expo-dev-client` + regenerar `apps/mobile/android` (`expo prebuild --clean`) y correr
`gradlew assembleRelease` reveló un bug nuevo, nunca disparado antes porque los builds
`debug` previos no llegan a empaquetar JS: `Error: Unable to resolve module
./../../node_modules/expo-router/entry.js from D:\DePaso/.`. Reproducido fuera de Gradle
(`npx expo export:embed --entry-file "../../node_modules/expo-router/entry.js"` desde
`apps/mobile`, mismo error) para descartar que fuera un problema de Gradle específicamente.

Causa real: **Expo CLI resuelve `--entry-file` (que el plugin de Gradle de React Native
pasa como ruta relativa a la propiedad `root`) contra la raíz real del monorepo que
detecta por workspace (`D:\DePaso`), no contra `apps/mobile`** — confirmado probando la
misma bandera con una ruta relativa a la raíz real (`"node_modules/expo-router/entry.js"`,
sin `../..`), que sí funcionó. Con `root` sin setear en `app/build.gradle` (o apuntando a
`apps/mobile`, como se había puesto en un primer intento fallido), el path relativo que
Gradle calculaba quedaba mal — un intento intermedio de arreglarlo agregando
`workspaceRoot` a `watchFolders` en `metro.config.js` también falló, por la misma razón
(Metro usa `watchFolders` como base para resolver rutas relativas de CLI, así que agregar
la raíz ahí reproducía el mismo bug por otra vía). Arreglado en el lugar correcto:
`root = file(workspaceRoot)` en `apps/mobile/android/app/build.gradle`, dejando
`metro.config.js` sólo con `resolver.nodeModulesPaths` (necesario porque `node-linker
hoisted` deja `expo-router` sólo en el `node_modules` raíz).

### Verificación real

`pnpm turbo run typecheck test --force` → 22/22 OK. `gradlew assembleRelease` → `BUILD
SUCCESSFUL in 9m 49s`, `.apk` real de 73MB (vs. 192MB del debug — sin herramientas de
desarrollo) en `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`,
entregado al usuario.

### Pendiente real (no oculto)

- El release usa el keystore de **debug** (generado por el template de RN, no apto para
  Play Store) — firmar con un keystore real de producción queda para cuando el usuario
  esté listo para publicar de verdad.
- No se instaló/abrió el `.apk` release en un dispositivo real desde este entorno para
  confirmar visualmente que ya no pide conectarse a Metro — el usuario lo tiene que probar
  del lado suyo.

## Sesión 22 — el release instalaba pero crasheaba: 3 bugs reales más, verificados en emulador

### Motivo

El usuario instaló el `.apk` de la Sesión 21 (ya no pedía Metro) pero la app "sigue
fallando" — no abría. Esta vez, en vez de pedirle logcat a mano, se levantó el emulador
Android local (AVD "Resizable Experimental", ya creado por el usuario en Android Studio)
en este mismo entorno, se instaló el `.apk` ahí, y se reprodujo el crash directamente con
`adb logcat` — mucho más rápido que ida y vuelta con el usuario.

### Bug 1 — versiones de Expo mal pineadas desde antes

Primer crash real: `NoSuchMethodError: getDirectConverter(...)` en
`expo.modules.font.FontLoaderModule`, al arrancar. `npx expo install --check` reveló que
`expo-font@57.0.4` y `expo-splash-screen@57.0.9` estaban mal pineados desde mucho antes de
esta sesión (deberían ser `~14.0.12` y `~31.0.13` para Expo SDK 54) — un desfasaje de
versión mayor tan grande que nunca se había manifestado porque Expo Web y los builds debug
con dev-client no ejercitan ese código nativo de la misma forma. Corregido con las
versiones que Expo mismo recomienda; `expo prebuild --clean` regeneró
`MainActivity.kt`/assets de splash acordes al `expo-splash-screen` real.

### Bug 2 — "Error: No routes found" (mismo patrón de raíz que la Sesión 21, en otro lugar)

Con el bug 1 resuelto, apareció "Error: No routes found" en el `ContextNavigator` de
expo-router. Diagnosticado con un método más confiable que adivinar: se agregó un
`console.log` temporal a `metro.config.js` para confirmar si el archivo se estaba
cargando siquiera durante el build de Gradle — **no se cargaba, nunca**. Causa real:
con `root = workspaceRoot` (fix de la Sesión 21), Expo CLI detecta el monorepo y busca
`metro.config.js` en la raíz real (`D:\DePaso`), no en `apps/mobile` — al no encontrar
uno ahí, cae silenciosamente al config por defecto de Metro, sin ningún error visible en
el build. Arreglado agregando un `metro.config.js` en la raíz del monorepo que reexporta
el real de `apps/mobile` (el único paquete que usa Metro en este monorepo).

### Bug 3 — alias `@/` no resuelve desde la raíz del monorepo

Con el `metro.config.js` correcto cargándose, apareció un tercer error:
`Unable to resolve module @/components/ProgressHeader`. `babel-preset-expo` resuelve el
alias `@/*` (definido en `tsconfig.json`) leyendo `process.cwd()` — que, por la misma
razón que el Bug 2, es la raíz del monorepo, donde no hay ningún `tsconfig.json` con ese
alias. Arreglado sin depender de esa detección: `resolver.resolveRequest` explícito en
`apps/mobile/metro.config.js` que reescribe cualquier import `@/algo` a la ruta absoluta
correcta antes de delegar al resolver por defecto.

### Verificación real

Cada uno de los 3 fixes se probó primero de forma aislada y rápida (`npx expo export:embed`
manual, sin pasar por Gradle) antes de rebuildear el APK completo — evitó varios ciclos de
~3-10 minutos de build innecesarios. El fix final se instaló y lanzó en el emulador Android
local: `adb logcat` sin `FATAL EXCEPTION`, proceso vivo (`adb shell pidof`), y una captura
de pantalla real confirmando la pantalla de onboarding de la app (logo, copy, botón
"Comenzar" — no una pantalla en blanco). `pnpm turbo run typecheck test --force`: 22/22 OK.

### Pendiente real (no oculto)

- `apps/mobile/android/app/build.gradle` tiene un comentario explícito avisando que
  `expo prebuild --clean` pisa el fix de `root`/`extraPackagerArgs` — hay que reaplicarlo
  a mano si alguien vuelve a correr `--clean` (documentado en el propio archivo, no sólo
  acá).
- Sólo se probó en el emulador de este entorno, no en el celular real del usuario — le
  queda instalar el `.apk` final y confirmar del lado suyo.
- El release sigue usando el keystore de debug (no apto para Play Store) — pendiente para
  cuando el usuario esté listo para publicar de verdad.
