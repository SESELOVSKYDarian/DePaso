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

/** Proveedores de login social soportados. */
export const oauthProviderIdSchema = z.enum(["google", "facebook", "discord"]);
export type OAuthProviderId = z.infer<typeof oauthProviderIdSchema>;

/** Qué proveedores tiene activados el servidor y los datos públicos para iniciar el flujo. */
export const oauthProvidersResponseSchema = z.object({
  providers: z.array(
    z.object({
      id: oauthProviderIdSchema,
      label: z.string(),
      configured: z.boolean(),
      /** Sólo presente si `configured`; el client id es público por diseño de OAuth. */
      clientId: z.string().nullable(),
      authorizationEndpoint: z.string(),
      scopes: z.array(z.string()),
    })
  ),
});
export type OAuthProvidersResponse = z.infer<typeof oauthProvidersResponseSchema>;

/**
 * Canje del `code` de OAuth (PKCE). El secreto del proveedor vive sólo en el servidor.
 * `consent` es obligatorio únicamente si la cuenta no existe todavía: mismo requisito legal
 * que el registro con email (mayoría de edad + términos + privacidad).
 */
export const oauthLoginRequestSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url().or(z.string().regex(/^[a-z][a-z0-9+.-]*:\/\//i)),
  codeVerifier: z.string().min(16),
  consent: z
    .object({
      ageConfirmed18Plus: z.literal(true),
      acceptTerms: z.literal(true),
      acceptPrivacyNotice: z.literal(true),
      marketingOptIn: z.boolean().default(false),
    })
    .optional(),
});
export type OAuthLoginRequest = z.infer<typeof oauthLoginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({ email: emailSchema });
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

/** Largo del código de recuperación que llega por mail (8 dígitos). */
export const RESET_CODE_LENGTH = 8;

const resetByTokenSchema = z.object({
  /** Link del mail: abre la página web de cambio de contraseña. */
  token: z.string().min(10),
  password: passwordSchema,
});
const resetByCodeSchema = z.object({
  /** Código del mail, escrito dentro de la app (no hace falta salir). */
  email: emailSchema,
  code: z.string().regex(/^\d{8}$/),
  password: passwordSchema,
});
export const resetPasswordRequestSchema = z.union([resetByTokenSchema, resetByCodeSchema]);

/** Paso 2 de la recuperación: comprueba el código sin cambiar nada. */
export const verifyResetCodeRequestSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{8}$/),
});
export type VerifyResetCodeRequest = z.infer<typeof verifyResetCodeRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

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
  /** Sólo en login social: `true` si esta llamada creó la cuenta (dispara el setup inicial). */
  isNewAccount: z.boolean().optional(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
