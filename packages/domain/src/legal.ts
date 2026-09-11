/**
 * Constantes legales/de negocio usadas por el flujo de registro. Fuente:
 * docs/legal-functional/LEGAL.md y FUNCTIONAL.md.
 */

/**
 * Versión de los documentos legales que el usuario acepta al registrarse — se persiste
 * en `UserConsent.documentVersion` para trazabilidad (requisito obligatorio, FUNCTIONAL.md
 * "Requisitos de auditoría y trazabilidad"). Usamos la fecha de la versión 1.0 de los
 * documentos fuente (PDFs, 10 sep 2026) porque el checklist pre-lanzamiento de LEGAL.md
 * todavía no tiene textos finales con datos reales del negocio — actualizar este valor
 * cuando haya una versión definitiva de T&C/Privacidad.
 */
export const LEGAL_DOCUMENT_VERSIONS = {
  TERMS: "2026-09-10-v1",
  PRIVACY: "2026-09-10-v1",
} as const;

/** "Para crear una cuenta declarás tener 18 años o más." (LEGAL.md, Edad y alcance del MVP). */
export const MIN_AGE_YEARS = 18;

/**
 * Longitud mínima de contraseña. No definida en la documentación de producto/legal — regla
 * de seguridad MVP razonable (sección 81: "hash fuerte de contraseñas").
 */
export const PASSWORD_MIN_LENGTH = 8;

/** TTL de sesión — "sesión persistente" (sección 10), valor MVP no definido en docs. */
export const SESSION_TTL_DAYS = 30;
