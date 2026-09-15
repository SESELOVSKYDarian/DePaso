import { z } from "zod";

/** Aporte comunitario: la evidencia es opcional y el precio nunca se toma como garantía. */
export const priceReportInputSchema = z.object({
  productVariantId: z.string().uuid(),
  storeBranchId: z.string().uuid(),
  reportedPrice: z.number().positive().max(9_999_999),
  requiresPromotion: z.boolean().default(false),
  promotionNote: z.string().trim().max(280).optional(),
  goodFaithDeclared: z.literal(true),
}).superRefine((value, ctx) => {
  if (value.requiresPromotion && !value.promotionNote) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["promotionNote"], message: "Explicá brevemente la promoción." });
});
export type PriceReportInput = z.input<typeof priceReportInputSchema>;
export const priceReportResponseSchema = z.object({ id: z.string(), createdAt: z.string(), status: z.literal("RECEIVED") });
