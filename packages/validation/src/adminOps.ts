import { z } from "zod";

/**
 * Superficie de admin para lo que quedaba como scaffold (Fase 20): usuarios (vista, sin
 * cambio de rol self-service — evita escalar privilegios sin la MFA que pide LEGAL.md
 * p.97, todavía NO DEFINIDA), reportes comunitarios + moderación (FLOWS.md "Flujo de
 * moderación y apelación", p.8: "ponderar, ocultar, rechazar... dejando trazabilidad
 * interna"), optimization runs (observabilidad). El trust score no se expone a usuarios
 * finales (BUSINESS-RULES.md p.7) pero sí a un admin autenticado — es uso interno, no una
 * superficie pública.
 */

export const adminUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
  trustScore: z
    .object({ score: z.number(), reportsSubmitted: z.number(), reportsConfirmed: z.number() })
    .nullable(),
});
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;

export const adminModerationEventResponseSchema = z.object({
  id: z.string(),
  type: z.enum([
    "REPORT_HIDDEN",
    "REPORT_WEIGHTED_DOWN",
    "REPORT_REJECTED",
    "USER_SUSPENDED",
    "USER_APPEALED",
    "PRICE_SENT_TO_REVIEW",
  ]),
  reason: z.string(),
  createdAt: z.string(),
  createdByAdminId: z.string().nullable(),
});

export const adminPriceReportResponseSchema = z.object({
  id: z.string(),
  userEmail: z.string(),
  productName: z.string(),
  storeName: z.string(),
  branchName: z.string(),
  reportedPrice: z.number(),
  requiresPromotion: z.boolean(),
  promotionNote: z.string().nullable(),
  hasEvidence: z.boolean(),
  createdAt: z.string(),
  moderationEvents: z.array(adminModerationEventResponseSchema),
});
export type AdminPriceReportResponse = z.infer<typeof adminPriceReportResponseSchema>;

export const moderationActionInputSchema = z.object({
  targetPriceReportId: z.string().uuid(),
  type: z.enum(["REPORT_HIDDEN", "REPORT_WEIGHTED_DOWN", "REPORT_REJECTED", "USER_SUSPENDED"]),
  reason: z.string().trim().min(1).max(500),
});
export type ModerationActionInput = z.input<typeof moderationActionInputSchema>;

export const adminOptimizationRunResponseSchema = z.object({
  id: z.string(),
  userEmail: z.string(),
  mode: z.enum(["BALANCED", "CHEAPEST", "FASTEST"]),
  transportMode: z.enum(["CAR", "MOTORCYCLE", "BICYCLE", "WALK", "PUBLIC_TRANSPORT"]),
  createdAt: z.string(),
  planCount: z.number(),
  bestEstimatedSavings: z.number().nullable(),
});
export type AdminOptimizationRunResponse = z.infer<typeof adminOptimizationRunResponseSchema>;
