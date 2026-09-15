import { createAdminCatalogClient, createAdminOpsClient, createApiClient, createAuthClient, createProductsClient } from "@depaso/api-client";
import { API_BASE_URL } from "./config";

const TOKEN_STORAGE_KEY = "depaso_admin_token";

/**
 * Token en `localStorage` (no hay keychain nativo acá — `apps/admin` corre en un navegador
 * de escritorio, sin la superficie de ataque de un dispositivo compartido que justificaría
 * más esfuerzo). Aceptable para un panel interno de operadores, no para datos de usuarios
 * finales — ver brecha de MFA documentada en `apps/api/lib/auth/requireAdmin.ts`.
 */
export function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredAdminToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

const client = createApiClient({
  baseUrl: API_BASE_URL,
  getAuthToken: () => getStoredAdminToken(),
});

export const authClient = createAuthClient(client);
export const productsClient = createProductsClient(client);
export const adminCatalogClient = createAdminCatalogClient(client);
export const adminOpsClient = createAdminOpsClient(client);
