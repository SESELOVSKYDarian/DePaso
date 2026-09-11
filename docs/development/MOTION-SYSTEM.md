# Motion System

Fuente: master prompt secciones 15-27. El movimiento es parte central de la identidad de
DePaso, no un adorno — "DePaso entiende lo que estás haciendo y te acompaña" (sección
100). Fuente numérica de los tokens: `packages/design-tokens/src/motion.ts` — nunca
hardcodear una duración o un spring distinto por pantalla.

## Tecnología

- **React Native Reanimated** para todo lo cotidiano — es el driver por defecto.
- **React Native Skia** sólo cuando aporta valor visual real (visualización especial de
  ruta, gráficos, efectos de ahorro) — no para componentes normales.
- **Expo Haptics** para feedback táctil, con moderación (ver abajo).
- **Lottie** sólo si un asset lo justifica — no llenar la app de Lotties.

## Tokens

```ts
duration = { instant: 110, fast: 170, normal: 240, slow: 360 } // ms

spring = {
  soft:   { damping: 18, stiffness: 140, mass: 1 },   // listas, entradas de contenido
  snappy: { damping: 20, stiffness: 260, mass: 0.9 }, // botones, checkboxes, selección
  bouncy: { damping: 12, stiffness: 180, mass: 1 },   // celebración puntual (ahorro, Top 3)
}
```

Performance: priorizar `transform`/`opacity`/shared values/worklets — evitar animaciones
JS-driven pesadas. Objetivo 60 FPS cuando el dispositivo lo permita (sección 18).

## Principios (sección 18, resumen operativo)

1. **Continuidad espacial** — si un elemento se convierte en otro, mantener relación visual.
2. **Feedback inmediato** — una acción reacciona al instante (por eso `spring.snappy` en
   press states, no `spring.soft`).
3. **Jerarquía** — no animar todo a la vez; stagger sutil, no simultáneo.
4. **Física natural** — springs, no easings lineales robóticos.
5. **Propósito** — cada animación comunica algo (camino, flujo, progreso, elección, ahorro
   — sección 100), nunca "porque sí".
6. **Performance** — 60 FPS es un requisito, no un nice-to-have.

## Reduced Motion (obligatorio)

Nunca depender de una animación para transmitir información indispensable. Implementado en
este pase en `AnimatedPressable` (`apps/mobile/components/AnimatedPressable.tsx`) vía
`useReducedMotion()` de Reanimated: con Reduce Motion activo, el cambio de escala es
inmediato (sin `withSpring`), no una alternativa "más simple" que igual anima — es un
patrón a repetir en cualquier componente animado nuevo.

## Haptics (sección 20)

Con moderación — no vibrar por cada interacción. Casos previstos: seleccionar mejor plan,
agregar producto, marcar producto comprado, confirmar reporte, finalizar compra.
`AnimatedPressable` expone `haptic?: boolean` (default `true`) para poder desactivarlo en
botones donde no aporta (ej. navegación simple entre tabs).

## Momentos clave (implementación pendiente por fase — no en este pase)

| Momento | Sección | Fase que lo implementa |
|---|---|---|
| Entrada de Home (stagger sutil) | 21 | Fase 7-8 |
| Agregar producto a la lista (fade + translate + spring) | 21 | Fase 9 |
| Animación de optimización ("Analizando productos...") | 21 | Fase 15-16 |
| Reveal del Top 3 (stagger + spring + micro-haptic) | 22-23 | Fase 16 |
| Count-up del ahorro (300-600ms) | 23 | Fase 16 |
| Dibujo progresivo de la ruta en el mapa | 24 | Fase 17 |
| Bottom sheets nativos | 25 | Fase 6-19 (transversal) |
| Shared transitions (producto→detalle, plan→mapa) | 26 | Cuando sea técnicamente estable, no forzado |
| Checkboxes del modo compra (spring + haptic) | 68 | Fase 18 |

Este pase sólo implementó el nivel más bajo (tokens + un componente base con press
feedback real) — los momentos de la tabla necesitan las pantallas correspondientes, que
todavía no existen (ver `PROGRESS.md`).
