# Plan de implementación por fase

Roadmap de 27 fases del master prompt (sección 95), con estado real a la fecha. "Hecho"
significa que hay código funcionando y (donde aplica) tests — no sólo un scaffold vacío.
Ver `PROGRESS.md` para el registro cronológico de qué se hizo en cada sesión.

| Fase | Objetivo | Estado | Notas |
|---|---|---|---|
| 0 | Auditoría y documentación técnica | **Hecho** | `docs/development/*` (este set de archivos) |
| 1 | Monorepo / arquitectura base | **Hecho** | pnpm + Turborepo, 7 packages, 4 apps scaffoldeadas |
| 2 | Design System + Motion System | **Hecho (genéricos) / Parcial (data-shaped)** | Tokens + `MOTION-SYSTEM.md` completos. Catálogo genérico completo: `Button`, `Card`, `BottomSheet`, `Dialog`, `Toast`, `Checkbox`, `FormField`, `Skeleton`, `EmptyState`, `AnimatedPressable`. Faltan sólo los componentes **atados a datos de producto** que no existen todavía (`ProductRow`, `PriceDisplay`, `PriceSourceBadge`, `ConfidenceBadge`, `StoreCard`, `RouteCard`, `OptimizationCard`, `SavingsBadge`) — se construyen con Fase 8/12/16, no antes, para no adivinar su forma |
| 3 | Navigation shell | **Hecho** | 5 tabs con branding real + ruteo completo por estado (`Stack.Protected`: onboarding → auth → tabs) + rutas empujadas desde el stack raíz (`places`, `route-context`, `legal`). Estructuralmente completo — el contenido de cada tab sigue creciendo con sus fases propias (9 Listas, 17 Mapa, etc.), eso nunca fue parte de "navigation shell" en sí |
| 4 | Auth | **Hecho — verificado con DB real** | `AuthProvider` implementado (`apps/api/lib/auth`), endpoints register/login/logout/me/account. Probado de punta a punta contra Postgres real: registro (`201`), login correcto (`200`) e incorrecto (`401` genérico), `me`, logout revoca la sesión (`401` después). Recuperación de contraseña pendiente (necesita proveedor de email, NO DEFINIDO). Sin pantallas de mobile/web todavía (llegan con Fase 5) |
| 5 | Onboarding + legal + privacidad | **Hecho — verificado con DB real** | `apps/mobile`: onboarding de 3 slides, login/registro reales (checkboxes 18+/T&C/privacidad/marketing, todos con la copy obligatoria de FUNCTIONAL.md, rediseñados con opciones Google/Apple — sección 10, sin credenciales OAuth todavía), pantallas legales nativas, modal de consentimiento de ubicación, ruteo por estado de auth (`Stack.Protected`), token en `expo-secure-store`. `/api/consents` probado contra DB real (`200`) |
| 6 | Lugares guardados | **Hecho — verificado con DB real** | CRUD completo (`GET`/`POST /api/places`, `PATCH`/`DELETE /api/places/:id`) probado contra Postgres real: crear 2 lugares, listar con favoritos primero. `PlacesContext` en `apps/mobile` (estado compartido, no refetch-on-focus), pantallas de lista + alta/edición con selector de tipo, geocoding vía `expo-location` (nativo, sin API key), botón "usar mi ubicación actual". Reachable desde Perfil → "Mis lugares" |
| 7 | "¿Por dónde vas a andar hoy?" | **Hecho — verificado con DB real** | `SavedRouteContext` CRUD probado contra Postgres real: crear preset "Trabajo → Casa" con 2 lugares reales, listarlo de vuelta. `TodayRouteContext` (recorrido efímero del día, sólo cliente), pantalla completa: cargar preset guardado, elegir lugares guardados, agregar lugar temporal (geocoded) con el prompt "¿guardar para otra vez?". Home ya muestra el recorrido real en vez de chips hardcodeados |
| 8 | Productos y búsqueda | **Pendiente** | Modelo listo (`Product`/`ProductVariant`/`ProductAlias`); sin búsqueda fuzzy/alias implementada |
| 9 | Listas | **Pendiente** | Modelo listo; sin UI ni endpoints |
| 10 | Preferencias | **Pendiente** | Tipos/enums listos (`ProductPreferenceType`, `StorePreferenceType`) y usados por el motor; sin UI de configuración |
| 11 | Comercios y sucursales | **Pendiente** | Modelo listo; sin admin CRUD |
| 12 | Precios | **Pendiente** | Modelo + estados listos; sin ingestión real (sólo seed procedural) |
| 13 | Sistema comunitario | **Pendiente** | `PriceReport`/`CommunityModerationEvent` modelados; sin `PriceConsensusService` implementado |
| 14 | Consensus + Trust | **Pendiente** | `UserTrustScore` modelado; sin `CommunityTrustService` implementado |
| 15 | **Optimization Engine** | **Hecho** | `@depaso/optimization` completo — pipeline de filtro por corredor, restricciones obligatorias, combinaciones 1-3 comercios, score de 5 dimensiones, explicación humana. Tests de los Casos A-E (sección 87) pasando |
| 16 | Top 3 | **Hecho (motor) / Pendiente (UI)** | El motor devuelve siempre BALANCED/FASTEST/CHEAPEST con explicación. Falta el reveal animado (sección 22-23) en `apps/mobile` |
| 17 | Mapas y rutas | **Parcial** | `MockRouteProvider` funcional para cálculo; sin mapa visual ni dibujo de ruta en `apps/mobile` |
| 18 | Modo compra | **Pendiente** | Sin checklist por comercio ni animaciones de sección 68 |
| 19 | Perfil y privacidad | **Pendiente** | Placeholder de tab con los 4 puntos obligatorios listados (Descargar datos / Corregir / Borrar lugares / Eliminar cuenta) — ninguno funcional todavía |
| 20 | Admin | **Parcial** | Scaffold bootable con mapa de secciones (sección 7); sin CRUD real (necesita auth + DB) |
| 21 | Tests | **Parcial** | 5 casos del motor de optimización cubiertos con Vitest. `PriceConsensusService`/`CommunityTrustService`/product matching sin implementar aún, por lo tanto sin tests |
| 22 | Performance | **No empezado** | Sin listas grandes ni datos reales todavía para medir |
| 23 | Motion polish | **Parcial** | Tokens + 1 componente animado real; el resto de momentos de la tabla en `MOTION-SYSTEM.md` están pendientes |
| 24 | Accessibility | **Parcial** | Touch targets ≥44px y contraste respetados en lo construido; sin auditoría formal (screen reader, dynamic type) |
| 25 | QA general | **No empezado** | Depende de tener flujos completos que probar |
| 26 | Build Android/iOS | **No empezado** | Sin emulador/Android Studio/Xcode en este entorno. `apps/mobile` sí se vio corriendo de verdad vía **Expo Web** (`npx expo start --web`, sección "Cómo correr y ver el progreso" en `PROGRESS.md`) — onboarding, login, registro con validación real, legal, todo confirmado visualmente. Expo Web no reemplaza probar en un dispositivo/emulador real (gestos táctiles, haptics, `expo-secure-store` nativo, tamaños de pantalla reales) — sigue pendiente |
| 27 | Preparación deploy | **No empezado** | Sin infraestructura de hosting definida |

## Cómo continuar (orden recomendado)

**Postgres local ya está resuelto** en esta máquina de desarrollo (PostgreSQL 17 nativo,
rol/base `depaso` — ver `docs/development/DECISIONS.md`, 2026-09-11). `prisma migrate dev`
corrió, el seed corrió, y Fase 4/6/7 se probaron de punta a punta contra la base real
(register → login → me → logout, lugares, contexto de ruta — ver `PROGRESS.md`, Sesión
7). En otra máquina/CI seguí usando `docker compose up -d` normalmente.

1. **Probar desde `apps/mobile` (Expo Web o dispositivo):** registro → onboarding ya
   visto → tabs → Perfil → Mis lugares → Home → elegir recorrido de hoy → guardarlo como
   preset — todo el backend ya está confirmado, esto es la vuelta de UI completa. El
   modal de ubicación y el geocoding real necesitan permisos de verdad (funcionan en
   Expo Web con la geolocalización del navegador; la prueba definitiva sigue siendo un
   dispositivo/emulador, no disponible en este entorno).
2. **Fase 8-12:** catálogo real, búsqueda, listas, preferencias, comercios/sucursales,
   ingestión de precios — el motor de optimización (Fase 15) ya está listo para
   consumirlos en cuanto existan.
5. **Fase 13-14:** `PriceConsensusService` y `CommunityTrustService` — la pseudológica ya
   está descrita en `docs/legal-functional/BUSINESS-RULES.md` (p.7-8), falta
   implementarla como servicio TypeScript puro (mismo patrón que `optimization`).
6. **Fase 16-18:** conectar el motor ya funcional a pantallas reales — Top 3 animado, mapa
   con ruta dibujada, modo compra.
7. **Fase 19-20:** Perfil/privacidad funcional (derechos del titular, sección
   obligatoria) y CRUD real del admin.
8. **Fase 21-25:** ampliar tests a los servicios nuevos, performance, motion polish,
   accesibilidad formal, QA end-to-end.
9. **Fase 26-27:** requiere un entorno con Android Studio/Xcode (o EAS Build en la nube) y
   una decisión de hosting — ninguno de los dos está disponible en este entorno de
   desarrollo.
