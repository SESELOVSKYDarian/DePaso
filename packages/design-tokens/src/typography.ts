/**
 * Tipografía. Fuente: branding/DePaso_Tipografia_Logo.md ("Combinación oficial
 * recomendada": Fredoka Bold para logo/titulares especiales, Montserrat SemiBold para
 * tagline/UI secundaria; Inter para interfaces muy densas) + niveles de
 * docs/brand-product/UX-UI.md (Display/Title/Body/Caption). Tamaños exactos de escala no
 * están definidos en la documentación de producto (NO DEFINIDO) más allá de "Body 16px
 * mobile" — el resto es elección de producto de este pase.
 */
export const fontFamilies = {
  /** Sólo identidad de marca: wordmark, titulares muy cortos, momentos de marca (ahorro
   * hero). No usar para bloques largos de texto. */
  brand: "Fredoka",
  /** UI general: títulos de sección, body, botones, labels. */
  body: "Montserrat",
  /** Interfaces densas (tablas de admin, listas largas) donde Montserrat pesa demasiado. */
  dense: "Inter",
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.brand,
    fontWeight: "700",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: fontFamilies.body,
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyRegular: {
    fontFamily: fontFamilies.body,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  tagline: {
    fontFamily: fontFamilies.body,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1.2, // ~12% tracking, spec del logo (branding/DePaso_Tipografia_Logo.md)
  },
} as const;

export type TypographyTokens = typeof typography;
