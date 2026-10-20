import { ApiError } from "@depaso/api-client";

export type ResetErrorKind = "invalid_code" | "rate_limited" | "email_not_configured" | "invalid_email" | "network";

/** Clasifica un error de los endpoints de recuperación de contraseña. */
export function classifyResetError(error: unknown): ResetErrorKind {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "INVALID_OR_EXPIRED_TOKEN") return "invalid_code";
    if (code === "RATE_LIMITED") return "rate_limited";
    if (code === "EMAIL_NOT_CONFIGURED") return "email_not_configured";
    if (error.status === 400) return "invalid_email";
  }
  return "network";
}

export const RESET_ERROR_MESSAGES: Record<ResetErrorKind, string> = {
  invalid_code: "El código es incorrecto o ya venció. Revisalo o pedí uno nuevo.",
  rate_limited: "Demasiados intentos. Esperá unos minutos y probá de nuevo.",
  email_not_configured: "El envío de mails todavía no está activado en el servidor.",
  invalid_email: "Ese email no parece válido.",
  network: "No pudimos conectar. Revisá tu conexión e intentá de nuevo.",
};

/**
 * En los pasos 2 y 3 el email ya viene validado del paso 1: un 400 genérico significa que el
 * código no es válido, no que el email esté mal.
 */
export function codeStepErrorKind(error: unknown): ResetErrorKind {
  const kind = classifyResetError(error);
  return kind === "invalid_email" ? "invalid_code" : kind;
}
