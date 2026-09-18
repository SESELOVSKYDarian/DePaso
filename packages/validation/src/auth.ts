/**
 * Schemas de auth. Fuente de los requisitos obligatorios de la pantalla de registro:
 * docs/legal-functional/FUNCTIONAL.md ("Pantalla de aceptación — requisitos obligatorios").
 */
import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@depaso/domain";

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH);

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(80).optional(),
  /** "Para crear una cuenta declarás tener 18 años o más." — obligatorio, debe ser true. */
  ageConfirmed18Plus: z.literal(true),
  /** Checkbox obligatorio: "Acepto los Términos y Condiciones de DePaso." */
  acceptTerms: z.literal(true),
  /** Link/aviso: "Conocé cómo tratamos tus datos en la Política de Privacidad." */
  acceptPrivacyNotice: z.literal(true),
  /** Checkbox opcional, desmarcado por defecto: "Quiero recibir novedades y promociones." */
  marketingOptIn: z.boolean().default(false),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const updateProfileRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(80).nullable().optional(),
  marketingOptIn: z.boolean().optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

/** Forma del usuario devuelta al cliente — nunca incluye `passwordHash`. */
export const authUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  marketingOptIn: z.boolean(),
  /** Ver enum `Role` — USER, MERCHANT (comercio aprobado por un admin) y ADMIN (docs/development/DECISIONS.md). */
  role: z.enum(["USER", "MERCHANT", "ADMIN"]),
  createdAt: z.string(),
});
export type AuthUserResponse = z.infer<typeof authUserResponseSchema>;

export const authResponseSchema = z.object({
  user: authUserResponseSchema,
  token: z.string(),
  expiresAt: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
