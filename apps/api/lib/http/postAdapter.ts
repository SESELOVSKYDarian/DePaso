/**
 * Nunca se usa GET: los datos (ids incluidos) viajan en el body JSON, nunca en la URL.
 * Estos helpers arman, a partir del body, la request que espera cada handler:
 *  - postWithParams: saca ids del body y los entrega como `params` (antes eran /[id]).
 *  - postAsQuery: pasa los campos del body como searchParams (antes era ?q=...).
 */
import { NextRequest, NextResponse } from "next/server";

type Body = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (request: NextRequest, context: any) => Promise<Response> | Response;

async function readBody(request: NextRequest): Promise<Body> {
  const json = await request.json().catch(() => null);
  return json && typeof json === "object" && !Array.isArray(json) ? (json as Body) : {};
}

/** Los ids del body pasan a `params`; el resto del body queda como body del handler. */
export function postWithParams(keys: string[], handler: Handler) {
  return async (request: NextRequest) => {
    const body = await readBody(request);
    const params: Record<string, string> = {};
    for (const key of keys) {
      const value = body[key];
      if (typeof value !== "string" || value.length === 0) {
        return NextResponse.json({ error: "INVALID_REQUEST", missing: key }, { status: 400 });
      }
      params[key] = value;
      delete body[key];
    }
    const next = new NextRequest(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(body),
    });
    return handler(next, { params: Promise.resolve(params) });
  };
}

/** Los campos del body se leen como query string (los arrays quedan como parámetros repetidos). */
export function postAsQuery(handler: (request: NextRequest) => Promise<Response> | Response) {
  return async (request: NextRequest) => {
    const body = await readBody(request);
    const url = new URL(request.url);
    url.search = "";
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue;
      const list = Array.isArray(value) ? value : [value];
      for (const item of list) url.searchParams.append(key, String(item));
    }
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    headers.delete("content-type");
    return handler(new NextRequest(url, { method: "GET", headers }));
  };
}
