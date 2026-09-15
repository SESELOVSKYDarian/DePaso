import { z } from "zod";
import {
  adminOptimizationRunResponseSchema,
  adminPriceReportResponseSchema,
  adminUserResponseSchema,
  type ModerationActionInput,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const usersSchema = z.object({ users: z.array(adminUserResponseSchema) });
const priceReportsSchema = z.object({ reports: z.array(adminPriceReportResponseSchema) });
const optimizationRunsSchema = z.object({ runs: z.array(adminOptimizationRunResponseSchema) });
const moderationActionResponseSchema = z.object({ id: z.string(), createdAt: z.string() });

/** Vistas de admin para lo que quedaba como scaffold (Fase 20) — sólo `role: "ADMIN"`. */
export function createAdminOpsClient(client: DepasoApiClient) {
  return {
    users: {
      list: () => client.get("/api/admin/users", usersSchema),
    },
    priceReports: {
      list: () => client.get("/api/admin/price-reports", priceReportsSchema),
    },
    moderation: {
      act: (body: ModerationActionInput) =>
        client.post("/api/admin/moderation", body, moderationActionResponseSchema),
    },
    optimizationRuns: {
      list: () => client.get("/api/admin/optimization-runs", optimizationRunsSchema),
    },
  };
}
