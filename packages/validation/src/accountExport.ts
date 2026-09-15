import { z } from "zod";

/**
 * Derecho de acceso (LEGAL.md p.14: "conocer, acceder..."). Junta las categorías del
 * inventario de datos de LEGAL.md p.5 que están bajo `userId` — no incluye `passwordHash`,
 * hashes de sesión, ni el trust score de OTROS usuarios (sólo el propio, que acá es
 * exportación privada al dueño de la cuenta, no una superficie pública — no choca con la
 * regla de "no publicar el trust score exacto", esa regla es sobre exposición a terceros).
 */
export const accountExportResponseSchema = z.object({
  exportedAt: z.string(),
  account: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string().nullable(),
    marketingOptIn: z.boolean(),
    ageConfirmed18Plus: z.boolean(),
    createdAt: z.string(),
  }),
  consents: z.array(
    z.object({
      type: z.string(),
      documentVersion: z.string(),
      accepted: z.boolean(),
      acceptedAt: z.string(),
    })
  ),
  places: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      address: z.string(),
      isFavorite: z.boolean(),
      createdAt: z.string(),
    })
  ),
  savedRouteContexts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      waypointPlaceIds: z.array(z.string()),
      createdAt: z.string(),
    })
  ),
  shoppingLists: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: z.string(),
      items: z.array(
        z.object({ productId: z.string(), quantity: z.number(), note: z.string().nullable() })
      ),
    })
  ),
  productPreferences: z.array(
    z.object({ productId: z.string(), type: z.string(), preferredBrandId: z.string().nullable() })
  ),
  storePreferences: z.array(
    z.object({ category: z.string(), type: z.string(), storeBranchId: z.string() })
  ),
  priceReports: z.array(
    z.object({
      id: z.string(),
      productVariantId: z.string(),
      storeBranchId: z.string(),
      reportedPrice: z.number(),
      requiresPromotion: z.boolean(),
      createdAt: z.string(),
    })
  ),
  trustScore: z
    .object({ score: z.number(), reportsSubmitted: z.number(), reportsConfirmed: z.number() })
    .nullable(),
});
export type AccountExportResponse = z.infer<typeof accountExportResponseSchema>;
