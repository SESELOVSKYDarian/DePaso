import { z } from "zod";

export const adKindSchema = z.enum(["FEATURED_PRODUCT", "BANNER"]);
export type AdKind = z.infer<typeof adKindSchema>;

export const adStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);
export type AdStatus = z.infer<typeof adStatusSchema>;

/** Lo que pide el comercio: qué quiere publicitar, cuánto ofrece y por cuántos días. */
export const adRequestInputSchema = z
  .object({
    kind: adKindSchema,
    title: z.string().trim().min(3, "Escribí un título.").max(80),
    message: z.string().trim().max(280).optional(),
    /** Solo para un producto destacado. */
    productId: z.string().min(1).optional(),
    /** Monto en pesos que el comercio está dispuesto a pagar. */
    offeredAmount: z.number().positive("Ofrecé un monto mayor a cero.").max(99_999_999),
    durationDays: z.number().int().min(1).max(90),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "FEATURED_PRODUCT" && !value.productId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["productId"], message: "Elegí qué producto querés destacar." });
    }
  });
export type AdRequestInput = z.infer<typeof adRequestInputSchema>;

export const adResponseSchema = z.object({
  id: z.string(),
  kind: adKindSchema,
  title: z.string(),
  message: z.string().nullable(),
  productId: z.string().nullable(),
  productName: z.string().nullable(),
  offeredAmount: z.number(),
  agreedAmount: z.number().nullable(),
  durationDays: z.number(),
  status: adStatusSchema,
  adminNote: z.string().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  /** `true` mientras está aprobada y dentro de sus fechas. */
  active: z.boolean(),
  createdAt: z.string(),
  /** Solo lo ve el administrador. */
  merchantName: z.string().nullable().default(null),
  merchantEmail: z.string().nullable().default(null),
});
export type AdResponse = z.infer<typeof adResponseSchema>;

export const adsResponseSchema = z.object({ ads: z.array(adResponseSchema), pendingCount: z.number().default(0) });
export type AdsResponse = z.infer<typeof adsResponseSchema>;

/** Decisión del administrador. Al aprobar puede cambiar el monto y los días respecto de lo ofrecido. */
export const adDecisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    agreedAmount: z.number().nonnegative().max(99_999_999).optional(),
    durationDays: z.number().int().min(1).max(90).optional(),
    note: z.string().trim().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "REJECT" && !value.note) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["note"], message: "Contale al comercio por qué no se aprueba." });
    }
  });
export type AdDecision = z.infer<typeof adDecisionSchema>;

/** Tarjeta de publicidad en Inicio. */
export const homeBannerSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string().nullable(),
  storeName: z.string(),
});
export type HomeBanner = z.infer<typeof homeBannerSchema>;
