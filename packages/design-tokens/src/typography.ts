/**
 * Tipografía. Fuente: branding/DePaso_Tipografia_Logo.md ("Combinación oficial
 * recomendada": Fredoka para logo/titulares/CTAs de marca, Montserrat para el resto de la
 * UI) + las variantes reales usadas en el archivo de Figma (Dev Mode MCP): cada nodo de
 * texto trae su familia/peso exactos como `font-['Fredoka:SemiBold']` o
 * `font-['Montserrat:SemiBold']` etc. Los nombres de `fontFamily` de abajo son los que
 * exporta `@expo-google-fonts/fredoka` y `@expo-google-fonts/montserrat` (cargados vía
 * `useFonts` en `app/_layout.tsx`) — sin esa carga, React Native ignora `fontFamily` y cae
 * al system font, que es la causa de que la UI se viera "distinta a Figma" antes de este
 * pase.
 */
export const fontFamilies = {
  brand: {
    regular: "Fredoka_400Regular",
    medium: "Fredoka_500Medium",
    semiBold: "Fredoka_600SemiBold",
    bold: "Fredoka_700Bold",
  },
  body: {
    regular: "Montserrat_400Regular",
    medium: "Montserrat_500Medium",
    semiBold: "Montserrat_600SemiBold",
    bold: "Montserrat_700Bold",
    extraBold: "Montserrat_800ExtraBold",
  },
} as const;

export const typography = {
  /** Wordmark / momentos de marca muy puntuales (ver assets exportados en
   * assets/images/logo-wordmark.png) — no se recrea como texto vivo en la mayoría de las
   * pantallas porque el asset ya trae los colores por letra correctos. */
  display: {
    fontFamily: fontFamilies.brand.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.4,
  },
  /** Saludo de Home ("¡Hola, Juan!"), "¡Listo!", nombre de usuario en Perfil — Fredoka Bold. */
  heroTitle: {
    fontFamily: fontFamilies.brand.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  /** Títulos de pantalla (Fredoka SemiBold): "Creá tu cuenta", "Verificá tu email",
   * "¿Usamos tu ubicación?", "¿Por dónde vas a andar hoy?", etc. Tamaño varía 22-32px por
   * pantalla en el propio Figma — se pasa explícito donde haga falta desviarse de 24. */
  screenTitle: {
    fontFamily: fontFamilies.brand.semiBold,
    fontSize: 24,
    lineHeight: 30,
  },
  /** Label de botón CTA navy (Fredoka SemiBold 16 blanco en Figma). */
  buttonLabel: {
    fontFamily: fontFamilies.brand.semiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  /** Encabezados de sección dentro de una pantalla ("Mis preferencias", "Tu ruta de hoy",
   * "Mis lugares") — Montserrat Bold, sin mayúsculas forzadas. */
  title: {
    fontFamily: fontFamilies.body.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  /** Nombres de item en listas (lugar, producto, comercio) — Montserrat Bold 14-15. */
  itemTitle: {
    fontFamily: fontFamilies.body.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  body: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyRegular: {
    fontFamily: fontFamilies.body.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  /** Subtítulos/labels de formulario — Montserrat SemiBold 14, el peso "por defecto" de
   * casi todo el texto secundario en Figma. */
  subtitle: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Texto legal/notas al pie muy chicas (11px) — mismo peso, tamaño menor. */
  legal: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: 11,
    lineHeight: 15,
  },
  tagline: {
    fontFamily: fontFamilies.body.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1.2, // ~12% tracking, spec del logo (branding/DePaso_Tipografia_Logo.md)
  },
} as const;

export type TypographyTokens = typeof typography;
