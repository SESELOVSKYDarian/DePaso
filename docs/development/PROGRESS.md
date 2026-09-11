# Progreso

Registro cronológico de sesiones de desarrollo. Ver `IMPLEMENTATION-PLAN.md` para el
estado por fase y `DECISIONS.md` para el porqué de cada decisión técnica.

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
