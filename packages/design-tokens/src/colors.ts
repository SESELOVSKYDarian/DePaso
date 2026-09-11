/**
 * Paleta DePaso. Fuente autoritativa: docs/brand-product/BRAND.md (p.12, del PDF) +
 * branding/DePaso_Tipografia_Logo.md. Ver docs/development/DECISIONS.md para la
 * resolución del token de fondo (`surface.base` vs `brand.cream`).
 *
 * Regla obligatoria de marca: `saving.lime` se reserva exclusivamente para ahorro / mejor
 * opción / confirmación — nunca decorativo masivo (BRAND.md, Gobernanza de marca).
 * Restricción de accesibilidad: `brand.route` (#6290C3) no debe usarse como texto chico
 * sobre blanco (contraste ≈3.3:1) — reservarlo para íconos, rutas, bordes o texto grande.
 */
export const colors = {
  brand: {
    navy: "#1A1341",
    route: "#6290C3",
    mint: "#C2E7DA",
    cream: "#F1FFE2",
  },
  saving: {
    lime: "#B7FF1A",
  },
  surface: {
    base: "#F7FAF8",
    primary: "#FFFFFF",
    secondary: "#F1FFE2",
    elevated: "#FFFFFF",
  },
  text: {
    primary: "#1A1341",
    secondary: "#4B4566",
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
    subtle: "#E3E1EC",
    strong: "#C7C3DA",
  },
} as const;

export type ColorTokens = typeof colors;
