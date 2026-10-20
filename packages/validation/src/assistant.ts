/**
 * Asistente de compras con IA: la persona escribe (o dicta) todo lo que necesita y el servidor
 * lo separa en productos, con las marcas más comunes de cada uno para elegir.
 */
import { z } from "zod";
import { productSearchResultSchema } from "./products";

export const assistantRequestSchema = z.object({
  text: z.string().trim().min(2).max(800),
});
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export const assistantItemSchema = z.object({
  /** Identificador local para la lista de revisión. */
  id: z.string(),
  /** Producto genérico que entendió la IA ("leche", "yerba taragui"). */
  term: z.string(),
  quantity: z.number().int().min(1).max(99),
  /** Id de tipo si se reconoció ("gaseosa"…); sirve para filtrar la búsqueda de marcas. */
  typeId: z.string().nullable(),
  /** Marcas más comunes para ese producto, con cuántos productos tiene cada una. */
  brands: z.array(z.object({ id: z.string(), name: z.string(), count: z.number() })),
  /** Los mejores resultados sin elegir marca (el primero es el que se agrega con "me da igual"). */
  candidates: z.array(productSearchResultSchema),
});
export type AssistantItem = z.infer<typeof assistantItemSchema>;

export const assistantResponseSchema = z.object({
  items: z.array(assistantItemSchema),
  /** `ai`: lo interpretó el modelo. `fallback`: corte simple por comas (sin IA configurada o caída). */
  source: z.enum(["ai", "fallback"]),
});
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
