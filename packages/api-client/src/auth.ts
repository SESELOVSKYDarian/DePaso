import { z } from "zod";
import {
  authResponseSchema,
  authUserResponseSchema,
  type LoginRequest,
  type RegisterRequest,
  type UpdateProfileRequest,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });

/** Métodos de auth sobre el cliente base — ver apps/api/app/api/auth/*. */
export function createAuthClient(client: DepasoApiClient) {
  return {
    register: (body: RegisterRequest) => client.post("/api/auth/register", body, authResponseSchema),
    login: (body: LoginRequest) => client.post("/api/auth/login", body, authResponseSchema),
    logout: () => client.post("/api/auth/logout", undefined, okSchema),
    me: () => client.get("/api/auth/me", authUserResponseSchema),
    updateProfile: (body: UpdateProfileRequest) =>
      client.patch("/api/auth/me", body, authUserResponseSchema),
    deleteAccount: () => client.delete("/api/auth/account", okSchema),
  };
}
