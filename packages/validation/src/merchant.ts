/**
 * Flujo de comercio: un usuario común solicita pasar a rol MERCHANT, un ADMIN lo aprueba o
 * rechaza, y el comercio aprobado carga sus propios productos y precios.
 */
import { z } from "zod";

const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const merchantRequestInputSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  address: z.string().trim().min(3).max(200),
  phone: z.string().trim().max(40).optional(),
  note: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type MerchantRequestInput = z.infer<typeof merchantRequestInputSchema>;

export const merchantRequestResponseSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  note: z.string().nullable(),
  status: requestStatusSchema,
  rejectionReason: z.string().nullable(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
});
export type MerchantRequestResponse = z.infer<typeof merchantRequestResponseSchema>;

/** `request: null` cuando el usuario nunca solicitó ser comercio. */
export const myMerchantRequestResponseSchema = z.object({
  request: merchantRequestResponseSchema.nullable(),
});
export type MyMerchantRequestResponse = z.infer<typeof myMerchantRequestResponseSchema>;

export const adminMerchantRequestResponseSchema = merchantRequestResponseSchema.extend({
  userId: z.string(),
  userEmail: z.string(),
  userDisplayName: z.string().nullable(),
});
export type AdminMerchantRequestResponse = z.infer<typeof adminMerchantRequestResponseSchema>;

export const adminMerchantRequestsResponseSchema = z.object({
  requests: z.array(adminMerchantRequestResponseSchema),
  pendingCount: z.number(),
});
export type AdminMerchantRequestsResponse = z.infer<typeof adminMerchantRequestsResponseSchema>;

export const merchantDecisionInputSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "REJECT" && !value.reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "Indicá el motivo del rechazo." });
    }
  });
export type MerchantDecisionInput = z.infer<typeof merchantDecisionInputSchema>;

export const merchantBranchResponseSchema = z.object({
  id: z.string(),
  storeName: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
export type MerchantBranchResponse = z.infer<typeof merchantBranchResponseSchema>;

export const merchantBranchEnvelopeSchema = z.object({ branch: merchantBranchResponseSchema });

/** Precio de una variante ya existente en el catálogo. */
export const merchantPriceInputSchema = z.object({
  productVariantId: z.string().min(1),
  price: z.number().positive().max(9_999_999),
});
export type MerchantPriceInput = z.infer<typeof merchantPriceInputSchema>;

/** Producto que todavía no existe en el catálogo: se crea junto con su primer precio. */
export const merchantProductInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  brandName: z.string().trim().max(60).optional(),
  unit: z.string().trim().min(1).max(20),
  unitSize: z.number().positive().max(1_000_000),
  price: z.number().positive().max(9_999_999),
});
export type MerchantProductInput = z.infer<typeof merchantProductInputSchema>;

export const merchantPriceResponseSchema = z.object({
  id: z.string(),
  productName: z.string(),
  productVariantId: z.string(),
  productVariantName: z.string(),
  category: z.string(),
  unit: z.string(),
  unitSize: z.number(),
  price: z.number(),
  updatedAt: z.string(),
});
export type MerchantPriceResponse = z.infer<typeof merchantPriceResponseSchema>;

export const merchantPricesResponseSchema = z.object({ prices: z.array(merchantPriceResponseSchema) });
export type MerchantPricesResponse = z.infer<typeof merchantPricesResponseSchema>;
