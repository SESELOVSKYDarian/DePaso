import { z } from "zod";

export const adKindSchema = z.enum(["FEATURED_PRODUCT", "BANNER", "IMAGE", "VIDEO"]);
export type AdKind = z.infer<typeof adKindSchema>;

/** Precio base por día (en pesos) de cada formato. El comercio puede ofrecer más, nunca menos. */
export const AD_PRICE_PER_DAY: Record<AdKind, number> = {
  FEATURED_PRODUCT: 500,
  BANNER: 800,
  IMAGE: 1500,
  VIDEO: 2500,
};

/** Cuántas publicidades (pendientes o vigentes) puede tener un comercio a la vez. */
export const MAX_ACTIVE_ADS = 3;

/** Opciones de duración que ofrece la app. */
export const AD_DURATIONS = [7, 15, 30];

/** Precio base por día de cada formato, tal como lo fija el administrador. */
export const adPricesSchema = z.object({
  FEATURED_PRODUCT: z.number().int().min(0).max(9_999_999),
  BANNER: z.number().int().min(0).max(9_999_999),
  IMAGE: z.number().int().min(0).max(9_999_999),
  VIDEO: z.number().int().min(0).max(9_999_999),
});
export type AdPrices = z.infer<typeof adPricesSchema>;

/** Monto mínimo para un formato y una cantidad de días (con los precios vigentes o, si no se pasan, los de fábrica). */
export function minAdAmount(kind: AdKind, days: number, prices: Record<AdKind, number> = AD_PRICE_PER_DAY): number {
  return prices[kind] * days;
}

const imageDataUri = z
  .string()
  .max(700_000, "La imagen es muy pesada.")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Imagen inválida.");

export const adStatusSchema = z.enum(["PENDING", "COUNTER", "APPROVED", "REJECTED", "CANCELLED"]);
export type AdStatus = z.infer<typeof adStatusSchema>;

/** Lo que pide el comercio: qué quiere publicitar, cuánto ofrece y por cuántos días. */
export const adRequestInputSchema = z
  .object({
    kind: adKindSchema,
    title: z.string().trim().min(3, "Escribí un título.").max(80),
    message: z.string().trim().max(280).optional(),
    /** Solo para un producto destacado. */
    productId: z.string().min(1).optional(),
    /** Imagen ya comprimida: obligatoria en la publicidad con imagen, opcional en el banner. */
    imageData: imageDataUri.optional(),
    /** Solo para la publicidad con video: enlace https a un archivo de video (.mp4). */
    videoUrl: z.string().trim().url("Pegá un enlace válido.").max(500).optional(),
    /** Monto en pesos que el comercio está dispuesto a pagar. */
    offeredAmount: z.number().positive("Ofrecé un monto mayor a cero.").max(99_999_999),
    durationDays: z.number().int().min(1).max(90),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "FEATURED_PRODUCT" && !value.productId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["productId"], message: "Elegí qué producto querés destacar." });
    }
    if (value.kind === "IMAGE" && !value.imageData) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["imageData"], message: "Subí la imagen de tu publicidad." });
    }
    if (value.kind === "VIDEO" && (!value.videoUrl || !/^https:\/\//i.test(value.videoUrl))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["videoUrl"], message: "Pegá el enlace https de tu video." });
    }
    // el monto mínimo lo controla el servidor con los precios que fijó el administrador
  });
export type AdRequestInput = z.infer<typeof adRequestInputSchema>;

export const adResponseSchema = z.object({
  id: z.string(),
  kind: adKindSchema,
  title: z.string(),
  message: z.string().nullable(),
  productId: z.string().nullable(),
  productName: z.string().nullable(),
  imageData: z.string().nullable().default(null),
  videoUrl: z.string().nullable().default(null),
  offeredAmount: z.number(),
  agreedAmount: z.number().nullable(),
  /** Monto que propuso el equipo mientras espera la respuesta del comercio. */
  counterAmount: z.number().nullable().default(null),
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
    decision: z.enum(["APPROVE", "COUNTER", "REJECT"]),
    agreedAmount: z.number().nonnegative().max(99_999_999).optional(),
    /** Solo al contraofertar: el monto que propone el equipo. */
    counterAmount: z.number().positive("Poné el monto que proponés.").max(99_999_999).optional(),
    durationDays: z.number().int().min(1).max(90).optional(),
    note: z.string().trim().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "COUNTER" && value.counterAmount === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["counterAmount"], message: "Poné el monto que proponés." });
    }
    if (value.decision === "REJECT" && !value.note) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["note"], message: "Contale al comercio por qué no se aprueba." });
    }
  });
export type AdDecision = z.infer<typeof adDecisionSchema>;

/** Respuesta del comercio a la contraoferta del equipo: aceptarla, rechazarla o proponer otro monto. */
export const adReplySchema = z
  .object({
    reply: z.enum(["ACCEPT", "DECLINE", "PROPOSE"]),
    amount: z.number().positive("Poné el monto que proponés.").max(99_999_999).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.reply === "PROPOSE" && value.amount === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: "Poné el monto que proponés." });
    }
  });
export type AdReply = z.infer<typeof adReplySchema>;

/** Publicidad (banner, imagen o video) que se muestra en Inicio. */
export const homeAdSchema = z.object({
  id: z.string(),
  kind: z.enum(["BANNER", "IMAGE", "VIDEO"]),
  title: z.string(),
  message: z.string().nullable(),
  storeName: z.string(),
  imageData: z.string().nullable().default(null),
  videoUrl: z.string().nullable().default(null),
});
export type HomeAd = z.infer<typeof homeAdSchema>;
