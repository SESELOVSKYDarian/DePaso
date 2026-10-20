import { assistantResponseSchema, type AssistantRequest } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Asistente de compras con IA - ver apps/api/app/api/ai/shopping-parse. */
export function createAssistantClient(client: DepasoApiClient) {
  return {
    parse: (body: AssistantRequest) => client.post("/api/ai/shopping-parse", body, assistantResponseSchema),
  };
}
