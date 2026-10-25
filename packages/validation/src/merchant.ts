/**
 * Flujo de comercio: un usuario común solicita pasar a rol MERCHANT, un ADMIN lo aprueba o
 * rechaza, y el comercio aprobado carga sus propios productos y precios.
 */
import { z } from "zod";

const requestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const merchantRequestInputSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  address: z.string().trim().min(3).max(200),
  /** Obligatorios: DePaso se comunica con la persona para verificar que trabaja en el comercio. */
  phone: z.string().trim().min(6, "Ingresá un teléfono de contacto.").max(40),
  contactEmail: z.string().trim().email("Ingresá un email de contacto válido.").max(120),
  note: z.string().trim().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Sucursal que ya está en DePaso (importada) y el comercio pide administrar. */
  storeBranchId: z.string().uuid().optional(),
});
export type MerchantRequestInput = z.infer<typeof merchantRequestInputSchema>;

export const merchantRequestResponseSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  contactEmail: z.string().nullable().default(null),
  note: z.string().nullable(),
  status: requestStatusSchema,
  rejectionReason: z.string().nullable(),
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
  /** Sucursal existente que se reclama (`null` = comercio nuevo). */
  storeBranchId: z.string().nullable().default(null),
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
  contactVerifiedAt: z.string().nullable().default(null),
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
    /** Para aprobar hay que confirmar que ya se verificó el vínculo por teléfono o correo. */
    contactVerified: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "APPROVE" && value.contactVerified !== true) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contactVerified"], message: "Confirmá que verificaste el contacto." });
    }
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

/** Sucursal ya cargada en DePaso que un comercio puede pedir administrar. */
export const claimableBranchSchema = z.object({
  id: z.string(),
  storeName: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  priceCount: z.number().int().nonnegative(),
});
export type ClaimableBranch = z.infer<typeof claimableBranchSchema>;
export const claimableBranchesResponseSchema = z.object({ branches: z.array(claimableBranchSchema) });

/** Precio de una variante ya existente en el catálogo. */
export const merchantPriceInputSchema = z.object({
  productVariantId: z.string().min(1),
  price: z.number().positive().max(9_999_999),
  /** Cómo lo llama el comercio en su góndola; vacío = el nombre del catálogo. */
  displayName: z.string().trim().max(120).optional(),
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
  /** Nombre propio del comercio para este producto, si lo cambió. */
  displayName: z.string().nullable().default(null),
  brandName: z.string().nullable().default(null),
  productType: z.string().nullable().default(null),
  /** De dónde salió el precio: `MERCHANT` lo cargó el comercio; si no, vino de una fuente pública. */
  sourceType: z.string().default("MERCHANT"),
});
export type MerchantPriceResponse = z.infer<typeof merchantPriceResponseSchema>;

export const merchantPricesResponseSchema = z.object({
  prices: z.array(merchantPriceResponseSchema),
  /** Total que coincide con la búsqueda/filtros (la lista viene paginada). */
  total: z.number().int().nonnegative().default(0),
  /** Tipos y marcas presentes en los precios de la sucursal, para filtrar como en el buscador. */
  facets: z
    .object({
      types: z.array(z.object({ id: z.string(), label: z.string(), count: z.number() })),
      brands: z.array(z.object({ id: z.string(), name: z.string(), count: z.number() })),
    })
    .default({ types: [], brands: [] }),
});

/** Búsqueda en los precios propios: texto, tipo, marca y página. */
export interface MerchantPriceQuery {
  q?: string;
  type?: string;
  brandId?: string;
  offset?: number;
}
export type MerchantPricesResponse = z.infer<typeof merchantPricesResponseSchema>;
