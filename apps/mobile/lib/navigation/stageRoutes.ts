/** El estado de la sesión que decide en qué parte de la app se está. */
export interface SessionStage {
  onboardingSeen: boolean;
  isAuthenticated: boolean;
  /** Cuenta nueva con el mail sin confirmar. */
  needsEmail: boolean;
  postSignupDone: boolean;
}

/** A dónde corresponde estar según el estado de la sesión. */
export function homeForStage({ onboardingSeen, isAuthenticated, needsEmail, postSignupDone }: SessionStage): string {
  if (!onboardingSeen) return "/onboarding";
  if (!isAuthenticated) return "/(auth)";
  if (needsEmail) return "/verify-email";
  if (!postSignupDone) return "/(setup)/location";
  return "/(tabs)";
}

/** Las partes de la app que pertenecen a una etapa concreta (el resto es la app con sesión). */
const STAGE_SEGMENTS = ["onboarding", "(auth)", "verify-email", "(setup)"];

/**
 * Las "pantallas de nadie": las que muestra expo-router cuando la dirección no existe, más
 * `auth` (el regreso del login con Google/Meta/Discord, que no es una pantalla de verdad).
 */
export const LOST_SEGMENTS = ["+not-found", "[...unmatched]", "_sitemap", "auth"];

/** ¿La pantalla en la que está la persona (su primer segmento) pertenece a la etapa a la que se quiere ir? */
export function belongsToStage(home: string, segment: string | undefined): boolean {
  const owner = STAGE_SEGMENTS.find((name) => home.includes(name));
  if (owner) return segment === owner;
  // etapa "con sesión": cualquier pantalla que no sea de otra etapa ni una pantalla perdida
  return segment !== undefined && !STAGE_SEGMENTS.includes(segment) && !LOST_SEGMENTS.includes(segment);
}