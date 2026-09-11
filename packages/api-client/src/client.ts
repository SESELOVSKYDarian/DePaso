import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API error ${status}`);
  }
}

export interface DepasoApiClientOptions {
  baseUrl: string;
  /** Token Bearer (mobile: leído de SecureStore, por eso puede ser async). En web, la
   * sesión viaja como cookie httpOnly y este método puede omitirse. */
  getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * Cliente HTTP tipado y validado con Zod. Crece a medida que `apps/api` expone más
 * endpoints (ver docs/development/API.md).
 */
export function createApiClient(options: DepasoApiClientOptions) {
  async function request<TResponseSchema extends z.ZodTypeAny>(
    method: HttpMethod,
    path: string,
    body: unknown,
    responseSchema: TResponseSchema
  ): Promise<z.infer<TResponseSchema>> {
    const token = await options.getAuthToken?.();
    const response = await fetch(`${options.baseUrl}${path}`, {
      method,
      credentials: "include", // permite que la cookie de sesión (web) viaje aunque baseUrl sea otro origin en dev
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(response.status, json);
    }
    return responseSchema.parse(json);
  }

  return {
    get: <T extends z.ZodTypeAny>(path: string, responseSchema: T) =>
      request("GET", path, undefined, responseSchema),
    post: <T extends z.ZodTypeAny>(path: string, body: unknown, responseSchema: T) =>
      request("POST", path, body, responseSchema),
    patch: <T extends z.ZodTypeAny>(path: string, body: unknown, responseSchema: T) =>
      request("PATCH", path, body, responseSchema),
    delete: <T extends z.ZodTypeAny>(path: string, responseSchema: T) =>
      request("DELETE", path, undefined, responseSchema),
  };
}

export type DepasoApiClient = ReturnType<typeof createApiClient>;
