# Design System

Fuente de tokens: `packages/design-tokens/src/`. Fuente de intención de marca:
`docs/brand-product/BRAND.md`, `docs/brand-product/UX-UI.md`,
`branding/DePaso_Tipografia_Logo.md`. Este documento explica cómo se usan los tokens, no
los repite — para valores exactos, leer el código de `design-tokens` (es la fuente única
de verdad, nunca hardcodear un hex o un tamaño en un componente).

## Color

| Token | Valor | Uso |
|---|---|---|
| `colors.brand.navy` | `#1A1341` | Texto principal, fondos premium, logo |
| `colors.brand.route` | `#6290C3` | Rutas, íconos, bordes — **nunca texto chico sobre blanco** (contraste ≈3.3:1) |
| `colors.brand.mint` | `#C2E7DA` | Cards suaves, estado confiable |
| `colors.brand.cream` | `#F1FFE2` | Acento de marca/logo puntual — no es el fondo de la app |
| `colors.saving.lime` | `#B7FF1A` | **Reservado exclusivamente** para ahorro / mejor opción / confirmación. Regla obligatoria de marca (BRAND.md, Gobernanza) — no usar como color decorativo masivo. |
| `colors.surface.base` | `#F7FAF8` | Fondo de la app (fuente: PDF, BRAND.md p.12 "Niebla") |
| `colors.state.*` | ver código | Success/warning/error/info genéricos — **distintos** de `saving.lime`, para no convertir toda la app en verde/lima (sección 11 del master prompt) |

Decisión de resolución `surface.base` vs `brand.cream`: ver
`docs/development/DECISIONS.md`, entrada 2026-09-11.

## Tipografía

- **Fredoka Bold** (`fontFamilies.brand`) — sólo identidad: wordmark, titulares muy
  cortos, momentos de marca (ej. el número de ahorro en el hero). Nunca para bloques
  largos de texto (branding doc, sección "Uso recomendado dentro de la marca").
- **Montserrat** (`fontFamilies.body`) — UI general: títulos de sección, body, botones,
  labels, tagline.
- **Inter** (`fontFamilies.dense`) — sólo para interfaces muy densas (ej. tablas del
  admin) donde Montserrat pesa demasiado.

Niveles (`typography.*`): `display` (hero/ahorro), `title` (secciones), `body`/
`bodyRegular` (listas/explicación, 16px), `caption` (fuente/actualización, alto
contraste), `tagline` (subtítulo de marca, tracking +12% por spec del logo).

Los tamaños exactos de la escala (más allá de "Body 16px mobile") no están definidos en
`docs/brand-product/UX-UI.md` — son elección de producto de este pase, documentada en el
código de `typography.ts`, ajustable sin romper la API de tokens.

## Spacing, radii, elevación

Escala base-8 (`spacing.xxs`..`spacing.xxxl`), radii `sm`/`md`/`lg`/`xl`/`full`,
elevación en 4 niveles (`elevation.level0`..`level3`, compatible con `shadow*` de React
Native). Ninguno está definido en la documentación de producto — es una escala estándar
razonable, no un valor "de marca".

## Accesibilidad (obligatoria, no opcional)

- Touch targets ≥44px (`touchTarget.minimum`) — sección 76.
- Estados de precio combinan ícono + texto, **nunca sólo color**
  (`docs/brand-product/UX-UI.md`, regla de accesibilidad obligatoria).
- `colors.brand.route` no se usa como texto chico sobre blanco (contraste insuficiente).

## Componentes reutilizables (sección 74)

Implementados hasta ahora, en `apps/mobile/components/`:

- `AnimatedPressable` — botón base con feedback de press (spring) y haptic opcional,
  respeta Reduce Motion.
- `PlaceholderScreen` — shell branded para tabs sin contenido real todavía.
- `FormField` — input con label/error, usado en login/registro.
- `Checkbox` — animado (spring `bouncy`→`snappy` + haptic de selección, sección 68), usado
  en los checkboxes obligatorios del registro.
- `LegalScreen`/`LegalParagraph`/`LegalBullet`/`LegalNotice` — layout de las pantallas
  legales nativas (`app/legal/*`).
- `LocationConsentModal` — modal de permiso de ubicación con la copy exacta de
  FUNCTIONAL.md. Usa `Modal` nativo con `animationType="slide"`, no un primitivo
  `BottomSheet` propio — ese sigue pendiente (ver abajo).
- `Skeleton` — pulso de opacidad (Reanimated, `withRepeat`) para estados de carga
  (sección 27); primer uso real en la lista de lugares guardados.
- `EmptyState` — emoji + título + descripción + acción opcional (sección 28); primer uso
  real en "Todavía no guardaste ningún lugar".
- `Button` — variantes `primary`/`secondary`/`ghost`/`lime`/`danger` sobre
  `AnimatedPressable`. `lime` es el único lugar fuera de `SavingsBadge` (todavía no
  construido) donde el lima aparece — reservado para confirmaciones con connotación de
  "conveniencia", nunca decorativo.
- `Card` — contenedor base (borde + radio + elevación opcional).
- `BottomSheet` — primitivo reutilizable (`Modal` + `animationType="slide"`), reemplaza
  tener que armar el backdrop/sheet a mano en cada pantalla nueva. `LocationConsentModal`
  (Fase 5) sigue con su propia implementación ad-hoc — no se refactorizó retroactivamente
  en este pase, queda como deuda menor documentada.
- `Dialog` — confirmación centrada (`Modal` + `animationType="fade"`) con acción
  destructiva opcional.
- `Toast`/`ToastProvider`/`useToast` — snackbar global, un toast activo a la vez,
  autodescarte a los 2.6s. Montado en la raíz de `apps/mobile` (`app/_layout.tsx`).
- `PillInput` — input redondo con ícono a la izquierda y toggle mostrar/ocultar para
  contraseñas; variante visual específica para login/registro (más suave que
  `FormField`, que sigue usándose en el resto de la app — ej. el form de lugares).
- `SocialButton` — botón "Continuar con Google/Apple" con el ícono de cada proveedor.
  Sin credenciales OAuth configuradas en este entorno (Google Cloud / Apple Developer) —
  el botón existe con el diseño real, pero al tocarlo avisa por toast que todavía no está
  conectado en vez de fingir un login (ver DECISIONS.md).
- `AuthHero` — encabezado de login/registro: isotipo real en una placa suave + título +
  subtítulo. Composición propia inspirada en un patrón visual de referencia que trajo el
  usuario, no una copia de esa ilustración (sección 94: no copiar diseños de terceros).

Quedan pendientes sólo los componentes **atados a forma de datos de producto** —
`ProductRow`, `PriceDisplay`, `PriceSourceBadge`, `ConfidenceBadge`, `StoreCard`,
`RouteCard`, `OptimizationCard`, `SavingsBadge`, `PlaceChip`/`PlaceSelector` genéricos,
`ShoppingProgress` — se construyen con las fases que los necesitan (8/12/16/18), no antes:
construirlos sin una pantalla real que los use arriesga adivinar mal su API. El catálogo
**genérico** (sin depender de datos de producto) está completo.
