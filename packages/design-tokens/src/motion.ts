/**
 * Motion tokens. Fuente: master prompt secciones 17-18. Detalle narrativo y de uso en
 * docs/development/MOTION-SYSTEM.md — este archivo es sólo la fuente numérica que
 * consume `apps/mobile` (React Native Reanimated) para no hardcodear configuraciones
 * distintas por pantalla.
 */
export const duration = {
  instant: 110,
  fast: 170,
  normal: 240,
  slow: 360,
} as const;

/**
 * Configs de spring para `withSpring` de Reanimated (damping/stiffness/mass). No hay un
 * valor "correcto" único — son puntos de partida razonables por sensación deseada,
 * calibrados a mano, a ajustar con feedback real de producto.
 */
export const spring = {
  /** Asentamiento suave, sin rebote — listas, entradas de contenido. */
  soft: { damping: 18, stiffness: 140, mass: 1 },
  /** Respuesta inmediata a un toque — botones, checkboxes, selección. */
  snappy: { damping: 20, stiffness: 260, mass: 0.9 },
  /** Rebote perceptible — momentos de celebración puntuales (ahorro, Top 3), con
   * moderación (sección 22: "sin confetti excesivo"). */
  bouncy: { damping: 12, stiffness: 180, mass: 1 },
} as const;

export const motion = { duration, spring } as const;
