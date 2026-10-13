/**
 * Paleta DePaso, en dos esquemas: `lightColors` y `darkColors`, con la misma forma.
 *
 * Dirección visual: neutros tipo Apple. Claro con gris niebla y blanco puro; oscuro con negro
 * real y superficies grafito (#1C1C1E / #2C2C2E). Sin tintes de color en los neutros: el color
 * de la marca aparece sólo donde significa algo (verde de UI, lima de ahorro, azul de ruta).
 *
 * Marca (docs/brand-product/BRAND.md, "Camino inteligente"): azul noche + azul ruta + menta +
 * lima reservado para ahorro. El navy `#1A1341` sigue siendo el color de acción en claro y
 * del logo; en oscuro la acción primaria pasa a blanco suave sobre negro (como los botones de
 * Apple/Vercel) para que no haya ningún violeta en la interfaz.
 *
 * Reglas de marca:
 * - `saving.lime` (#B7FF1A) se reserva para ahorro / mejor opción / confirmación — nunca
 *   decorativo masivo. `brand.accent` es el verde de UI general (progreso, checks, chips).
 * - `brand.navy` es el color de "acción primaria" (botones, avatares, selección) y
 *   `text.onNavy` el texto sobre ese relleno: en oscuro son blanco suave y negro.
 *
 * Usar siempre vía `useColors()` en la app; `colors` (claro) queda sólo por compatibilidad con
 * código que no tiene tema (apps web, scripts).
 */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

const light = {
  brand: {
    /** Acción primaria y marca: botones, avatares, íconos de énfasis. */
    navy: "#1A1341",
    /** Azul de ruta: rutas, vínculos, elementos secundarios. ≥ 4.5:1 sobre blanco. */
    route: "#2B76BD",
    /** Verde de UI (progreso, checkboxes, chips) — no es el lima de ahorro. */
    accent: "#9EE457",
    /** Texto/ícono verde sobre fondos claros o con tinte verde (≥ 4.5:1). */
    accentDark: "#3F7A22",
    mint: "#C2E7DA",
    cream: "#F1FFE2",
  },
  saving: {
    lime: "#B7FF1A",
  },
  surface: {
    /** Fondo de pantalla. */
    base: "#F5F5F7",
    primary: "#FFFFFF",
    secondary: "#F0F9EC",
    elevated: "#FFFFFF",
    /** Fondo de inputs y celdas OTP. */
    input: "#EDEDF0",
  },
  /** Fondos con tinte de color para banners/badges, con su borde a juego. */
  tint: {
    blue: { bg: "#EEF5FF", border: "#CFE0FA" },
    green: { bg: "#ECF8EE", border: "#C4E8CB" },
    amber: { bg: "#FFF6E0", text: "#8A4B00" },
  },
  text: {
    primary: "#1D1D1F",
    secondary: "#515154",
    /** Avisos legales y notas al pie muy chicas. */
    tertiary: "#68686D",
    muted: "#68686D",
    onNavy: "#FFFFFF",
    onLime: "#1D1D1F",
  },
  state: {
    success: "#2FA66B",
    warning: "#F5A623",
    error: "#E5484D",
    info: "#2B76BD",
    /** Variantes para TEXTO e íconos chicos (contraste ≥ 4.5:1); las de arriba son para
     * rellenos, bordes y badges. */
    successStrong: "#1F7A4D",
    errorStrong: "#C4343A",
  },
  border: {
    subtle: "#E5E5EA",
    strong: "#C7C7CC",
  },
} as const;

export type ColorTokens = Widen<typeof light>;

export const lightColors: ColorTokens = light;

export const darkColors: ColorTokens = {
  brand: {
    // Acción primaria en oscuro: blanco suave (texto negro encima, `text.onNavy`).
    navy: "#F5F5F7",
    route: "#4DA3FF",
    accent: "#9EE457",
    accentDark: "#B5F27D",
    mint: "#14261C",
    cream: "#101A12",
  },
  saving: {
    lime: "#B7FF1A",
  },
  surface: {
    base: "#000000",
    primary: "#1C1C1E",
    secondary: "#101A13",
    elevated: "#2C2C2E",
    input: "#2C2C2E",
  },
  tint: {
    blue: { bg: "#0E1A2B", border: "#1C3558" },
    green: { bg: "#0F2016", border: "#1E4430" },
    amber: { bg: "#2A2108", text: "#FFD60A" },
  },
  text: {
    primary: "#F5F5F7",
    secondary: "#A1A1A6",
    tertiary: "#8E8E93",
    muted: "#98989D",
    onNavy: "#000000",
    onLime: "#1D1D1F",
  },
  state: {
    success: "#30D158",
    warning: "#FFD60A",
    error: "#FF453A",
    info: "#4DA3FF",
    successStrong: "#5DE08A",
    errorStrong: "#FF6961",
  },
  border: {
    subtle: "#38383A",
    strong: "#545458",
  },
};

/** Compatibilidad: paleta clara. En la app usar `useColors()`. */
export const colors = lightColors;
