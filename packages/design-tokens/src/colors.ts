/**
 * Paleta DePaso. Fuente autoritativa: docs/brand-product/BRAND.md (p.12, del PDF) +
 * branding/DePaso_Tipografia_Logo.md para la intención de marca, y las variables reales
 * publicadas en el archivo de Figma (Dev Mode MCP, `plugin-figma-dev-mode`, node
 * depaso-carga/inicio/perfil/etc — ver docs/development/DECISIONS.md) para los valores
 * exactos: `Primary`, `Secondary`, `Secondary2`, `Accent`, `Accent-Dark`, `Background2`,
 * más los grises/bordes/tintes usados de forma consistente en todas las pantallas.
 *
 * Regla obligatoria de marca: `saving.lime` (#B7FF1A, valor literal en Figma — no es una
 * variable reutilizable ahí tampoco) se reserva exclusivamente para ahorro / mejor opción /
 * confirmación — nunca decorativo masivo (BRAND.md, Gobernanza de marca). `brand.accent`
 * (#9EE457, variable "Accent" de Figma) es el verde de UI general (barras de progreso,
 * checkboxes, chips) — un verde distinto y no gobernado por esa restricción.
 * Restricción de accesibilidad: `brand.route` (#6290C3) no debe usarse como texto chico
 * sobre blanco (contraste ≈3.3:1) — reservarlo para íconos, rutas, bordes o texto grande.
 */
export const colors = {
  brand: {
    navy: "#1A1341",
    route: "#6290C3",
    /** Variable Figma "Accent" — verde de UI (progreso, checkboxes, chips), no el lima de ahorro. */
    accent: "#9EE457",
    /** Variable Figma "Accent-Dark" — texto/ícono sobre fondos con tinte verde claro. */
    accentDark: "#587E32",
    mint: "#C2E7DA",
    cream: "#F1FFE2",
  },
  saving: {
    lime: "#B7FF1A",
  },
  surface: {
    /** Variable Figma "Background2" — fondo de pantalla y botones sociales/secundarios. */
    base: "#F7F8F7",
    primary: "#FFFFFF",
    secondary: "#F1FFE2",
    elevated: "#FFFFFF",
    /** Fondo de inputs de formulario y celdas OTP — un gris ligeramente más frío que `base`. */
    input: "#F5F7FA",
  },
  /** Fondos con tinte de color para banners/badges (todos con su propio borde a juego). */
  tint: {
    blue: { bg: "#EFF6FF", border: "#BFDBFE" },
    green: { bg: "#EAF7EB", border: "#A7F3D0" },
    amber: { bg: "#FEF3C7", text: "#D97706" },
  },
  text: {
    primary: "#1A1341",
    /** Variable Figma "Secondary2" — gris de texto secundario/subtítulos en toda la app. */
    secondary: "#5A6578",
    /** Texto terciario (avisos legales, notas al pie muy chicas). */
    tertiary: "#9AA4B5",
    muted: "#8A86A3",
    onNavy: "#FFFFFF",
    onLime: "#1A1341",
  },
  /**
   * Estados genéricos de UI (formularios, toasts, badges) — distintos de `saving.lime`,
   * que queda reservado sólo para ahorro/mejor opción. Valores no provienen del PDF (no
   * definidos ahí); son elección de producto documentada acá.
   */
  state: {
    success: "#4CAF7D",
    warning: "#F5A623",
    error: "#E5484D",
    info: "#6290C3",
  },
  border: {
    /** Variable Figma — borde estándar de cards, inputs, divisores, barras de progreso. */
    subtle: "#E2E8F0",
    strong: "#C7C3DA",
  },
} as const;

export type ColorTokens = typeof colors;
