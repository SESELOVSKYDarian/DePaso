import {
  priceReportResponseSchema,
  type PriceReportInput,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Reporte comunitario de precio (Fase 13-14) — ver apps/api/app/api/price-reports. */
export function createPriceReportsClient(client: DepasoApiClient) {
  return {
    submit: (body: PriceReportInput) =>
      client.post("/api/price-reports", body, priceReportResponseSchema),
  };
}
