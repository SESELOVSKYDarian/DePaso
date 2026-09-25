import { paymentMethodsResponseSchema, promoSyncResponseSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Medios de pago del usuario y sincronización de promos (admin) — ver apps/api/app/api/payment-methods. */
export function createPaymentsClient(client: DepasoApiClient) {
  return {
    getMethods: () => client.get("/api/payment-methods", paymentMethodsResponseSchema),
    setMethods: (methods: string[]) => client.put("/api/payment-methods", { methods }, paymentMethodsResponseSchema),
    syncPromos: () => client.post("/api/promos/sync", {}, promoSyncResponseSchema),
  };
}
