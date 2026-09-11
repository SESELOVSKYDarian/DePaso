/**
 * Consentimientos posteriores al registro (ej. ubicación — sección 30-31 del master
 * prompt: "Permitir mientras uso DePaso" es un consentimiento específico, separado del de
 * T&C/Privacidad del registro). TERMS/PRIVACY/MARKETING del registro no pasan por acá
 * (van en `registerRequestSchema` — ver `auth.ts`).
 */
import { z } from "zod";

export const consentRequestSchema = z.object({
  type: z.enum(["LOCATION", "MARKETING"]),
  accepted: z.boolean(),
});
export type ConsentRequest = z.infer<typeof consentRequestSchema>;
