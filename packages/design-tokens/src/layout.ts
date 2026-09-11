/** Spacing en escala base-8 (con 4 como paso fino). No definido explícitamente en la
 * documentación de producto — elección de producto de este pase. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

/** Elevación como sombra (compatible con React Native `shadow*` / Skia). */
export const elevation = {
  level0: { shadowColor: "#1A1341", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  level1: { shadowColor: "#1A1341", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  level2: { shadowColor: "#1A1341", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  level3: { shadowColor: "#1A1341", shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
} as const;

/** Touch targets mínimos (sección 76: accesibilidad, >=44px). */
export const touchTarget = {
  minimum: 44,
} as const;
