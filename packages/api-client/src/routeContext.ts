import { z } from "zod";
import { routeContextResponseSchema, type RouteContextInput } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });
const listSchema = z.object({ routeContexts: z.array(routeContextResponseSchema) });

/** Contextos de ruta guardados — ver apps/api/app/api/route-contexts. */
export function createRouteContextClient(client: DepasoApiClient) {
  return {
    list: () => client.get("/api/route-contexts", listSchema),
    create: (body: RouteContextInput) =>
      client.post("/api/route-contexts", body, routeContextResponseSchema),
    remove: (id: string) => client.delete(`/api/route-contexts/${id}`, okSchema),
  };
}
