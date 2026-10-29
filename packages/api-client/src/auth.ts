import { z } from "zod";
import {
  authResponseSchema,
  authUserResponseSchema,
  oauthProvidersResponseSchema,
  type ForgotPasswordRequest,
  type LoginRequest,
  type OAuthLoginRequest,
  type OAuthProviderId,
  type RegisterRequest,
  type ResetPasswordRequest,
  type UpdateProfileRequest,
  type VerifyResetCodeRequest,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });

/** Métodos de auth sobre el cliente base — ver apps/api/app/api/auth/*. */
export function createAuthClient(client: DepasoApiClient) {
  return {
    register: (body: RegisterRequest) => client.post("/api/auth/register", body, authResponseSchema),
    login: (body: LoginRequest) => client.post("/api/auth/login", body, authResponseSchema),
    refresh: (refreshToken: string) => client.post("/api/auth/refresh", { refreshToken }, authResponseSchema),
    logout: () => client.post("/api/auth/logout", undefined, okSchema),
    providers: () => client.post("/api/auth/providers", {}, oauthProvidersResponseSchema),
    oauthLogin: (provider: OAuthProviderId, body: OAuthLoginRequest) =>
      client.post(`/api/auth/oauth/${provider}`, body, authResponseSchema),
    forgotPassword: (body: ForgotPasswordRequest) => client.post("/api/auth/forgot-password", body, okSchema),
    verifyResetCode: (body: VerifyResetCodeRequest) => client.post("/api/auth/verify-reset-code", body, okSchema),
    resetPassword: (body: ResetPasswordRequest) => client.post("/api/auth/reset-password", body, okSchema),
    me: () => client.post("/api/auth/me", {}, authUserResponseSchema),
    updateProfile: (body: UpdateProfileRequest) =>
      client.put("/api/auth/me", body, authUserResponseSchema),
    deleteAccount: () => client.delete("/api/auth/account", {}, okSchema),
  };
}
