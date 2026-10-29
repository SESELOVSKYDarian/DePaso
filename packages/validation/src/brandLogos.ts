import { z } from "zod";

/** Logo de una cadena de comercios, listo para mostrar. */
export const brandLogoSchema = z.object({
  slug: z.string(),
  name: z.string(),
  /** Nombres con los que se reconoce la cadena (ya normalizados). */
  aliases: z.array(z.string()),
  /** La imagen como `data:image/png;base64,...`: se muestra sin pedir nada más. */
  imageDataUri: z.string(),
});
export type BrandLogo = z.infer<typeof brandLogoSchema>;

export const brandLogosResponseSchema = z.object({ logos: z.array(brandLogoSchema) });
export type BrandLogosResponse = z.infer<typeof brandLogosResponseSchema>;
