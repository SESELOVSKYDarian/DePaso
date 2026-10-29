import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API error ${status}`);
  }
}

/** Nunca GET: leer y crear es POST, actualizar es PUT y borrar es DELETE. */
type HttpMethod = "POST" | "PUT" | "DELETE";

export interface DepasoApiClientOptions {
  baseUrl: string;
  /** Access token Bearer (mobile: leído de SecureStore, por eso puede ser async). En web, la
   * sesión viaja como cookie httpOnly y este método puede omitirse. */
  getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /**
   * Se llama cuando el servidor responde 401 con un access token enviado: debe canjear el
   * refresh token y devolver el access token nuevo (o null si no se pudo). Si devuelve un
   * token, el cliente repite el pedido una sola vez.
   */
  onUnauthorized?: () => Promise<string | null | undefined>;
}

/**
 * Cliente HTTP tipado y validado con Zod. No se usa GET: leer y crear es POST, actualizar es
 * PUT y borrar es DELETE, y los datos (ids incluidos) viajan en el body JSON
 * (ver docs/development/API.md).
 */
export function createApiClient(options: DepasoApiClientOptions) {
  async function send(method: HttpMethod, path: string, body: unknown, token: string | null | undefined) {
    return fetch(`${options.baseUrl}${path}`, {
      method,
      credentials: "include", // permite que la cookie de sesión (web) viaje aunque baseUrl sea otro origin en dev
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
  }

  async function request<TResponseSchema extends z.ZodTypeAny>(
    method: HttpMethod,
    path: string,
    body: unknown,
    responseSchema: TResponseSchema
  ): Promise<z.infer<TResponseSchema>> {
    const token = await options.getAuthToken?.();
    let response = await send(method, path, body, token);

    // access token vencido: renuevo con el refresh token y reintento una vez
    if (response.status === 401 && token && options.onUnauthorized) {
      const fresh = await options.onUnauthorized();
      if (fresh) response = await send(method, path, body, fresh);
    }

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(response.status, json);
    }
    return responseSchema.parse(json);
  }

  return {
    /** Leer, listar y crear. */
    post: <T extends z.ZodTypeAny>(path: string, body: unknown, schema: T) => request("POST", path, body, schema),
    /** Actualizar. */
    put: <T extends z.ZodTypeAny>(path: string, body: unknown, schema: T) => request("PUT", path, body, schema),
    /** Borrar. */
    delete: <T extends z.ZodTypeAny>(path: string, body: unknown, schema: T) => request("DELETE", path, body, schema),
  };
}

export type DepasoApiClient = ReturnType<typeof createApiClient>;
