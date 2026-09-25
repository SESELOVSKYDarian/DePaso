/**
 * Medios de pago del usuario y promos aplicadas. Los slugs válidos vienen de
 * `PAYMENT_METHODS` en `@depaso/domain`.
 */
import { z } from "zod";
import { PAYMENT_METHOD_SLUGS } from "@depaso/domain";

const paymentMethodSlugSchema = z.string().refine((slug) => PAYMENT_METHOD_SLUGS.includes(slug), {
  message: "Medio de pago desconocido",
});

export const paymentMethodsInputSchema = z.object({
  methods: z.array(paymentMethodSlugSchema).max(PAYMENT_METHOD_SLUGS.length),
});
export type PaymentMethodsInput = z.infer<typeof paymentMethodsInputSchema>;

export const paymentMethodsResponseSchema = z.object({ methods: z.array(z.string()) });
export type PaymentMethodsResponse = z.infer<typeof paymentMethodsResponseSchema>;

export const promoSyncResponseSchema = z.object({
  fetched: z.number(),
  accepted: z.number(),
  discarded: z.number(),
});
export type PromoSyncResponse = z.infer<typeof promoSyncResponseSchema>;

/** Promo aplicada a una parada del plan (ver `POST /api/optimization`). */
export const appliedPromoSchema = z.object({
  retailer: z.string(),
  /** Texto listo para mostrar, ej. "Cuenta DNI · 10% (tope $15.000)". */
  label: z.string(),
  discountAmount: z.number().nonnegative(),
  /** Aviso obligatorio: las condiciones reales las define el comercio y el emisor. */
  disclaimer: z.string(),
  sourceUrl: z.string().nullable(),
});
export type AppliedPromo = z.infer<typeof appliedPromoSchema>;
