import { PRODUCT_TYPES } from "@depaso/domain";
import { z } from "zod";
import { chatCompletion, extractJsonObject, isLlmConfigured } from "./llm";

export const MAX_PARSED_ITEMS = 12;

export interface ParsedItem {
  /** Nombre genérico del producto, en singular, con la marca sólo si la persona la nombró. */
  term: string;
  quantity: number;
  /** Id de tipo (`"gaseosa"`…) si la IA lo reconoció. */
  typeId: string | null;
}

const KNOWN_TYPE_IDS = new Set(PRODUCT_TYPES.map((type) => type.id));

const modelItemSchema = z.object({
  term: z.string().trim().min(1).max(60),
  quantity: z.coerce.number().int().min(1).max(99).catch(1),
  type: z.string().nullish(),
});
const modelOutputSchema = z.object({ items: z.array(modelItemSchema).min(1) });

function systemPrompt(): string {
  const types = PRODUCT_TYPES.map((type) => `${type.id} (${type.label})`).join(", ");
  return [
    "Sos el asistente de compras de DePaso, una app de supermercado de Argentina.",
    "Recibís un texto, a veces dictado por voz y con errores, con todo lo que una persona necesita comprar.",
    'Respondé SOLO con un JSON válido, sin explicaciones, con esta forma: {"items":[{"term":"leche","quantity":2,"type":"leche"}]}.',
    "Reglas:",
    '- "term": el producto en singular y en minúsculas, lo más genérico posible ("gaseosa", "yerba", "arroz"). Si la persona nombra una marca, dejala ("yerba taragui", "coca cola").',
    '- "quantity": entero mayor o igual a 1. Si no dice cantidad, 1. "una docena" es 12; "un par" es 2.',
    `- "type": uno de estos ids, o null si no estás seguro: ${types}.`,
    "- No inventes productos que no se mencionan. No agregues marcas que no se dijeron. Un ítem por producto distinto.",
    `- Máximo ${MAX_PARSED_ITEMS} ítems.`,
  ].join("\n");
}

/** Normaliza lo que devolvió el modelo; descarta ids de tipo inventados. */
export function parseModelOutput(raw: string): ParsedItem[] | null {
  const json = extractJsonObject(raw);
  const parsed = modelOutputSchema.safeParse(json);
  if (!parsed.success) return null;
  return parsed.data.items.slice(0, MAX_PARSED_ITEMS).map((item) => ({
    term: item.term.toLowerCase(),
    quantity: item.quantity,
    typeId: item.type && KNOWN_TYPE_IDS.has(item.type) ? item.type : null,
  }));
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, docena: 12,
};
const FILLER = /^(necesito|necesitamos|quiero|queremos|comprar|compra|me falta(n)?|faltan?|tambien|además|ademas|y|más|mas|también|llevar|agregá|agrega|anotá|anota)\s+/i;

/**
 * Alternativa sin IA: parte el texto por comas, saltos de línea, "y" y "más", y lee la cantidad
 * si empieza con un número ("2 leches", "dos gaseosas"). No entiende marcas ni tipos.
 */
export function splitShoppingText(text: string): ParsedItem[] {
  const parts = text
    .replace(/[.;]/g, ",")
    .split(/,|\n|\s+y\s+|\s+más\s+|\s+mas\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  const items: ParsedItem[] = [];
  for (const part of parts) {
    let rest = part;
    for (let i = 0; i < 3 && FILLER.test(rest); i += 1) rest = rest.replace(FILLER, "");
    let quantity = 1;
    const match = rest.match(/^(\d{1,2}|[a-záéíóú]+)\s+(?:de\s+)?(.+)$/i);
    if (match) {
      const value = /^\d+$/.test(match[1]!) ? Number(match[1]) : NUMBER_WORDS[match[1]!.toLowerCase()];
      if (value && match[2]) {
        quantity = Math.min(99, Math.max(1, value));
        rest = match[2];
      }
    }
    const term = rest.trim().toLowerCase();
    if (term.length >= 2) items.push({ term: term.slice(0, 60), quantity, typeId: null });
  }
  return items.slice(0, MAX_PARSED_ITEMS);
}

/** Convierte el pedido en ítems. Usa la IA si está configurada; si no, o si falla, el corte simple. */
export async function parseShoppingText(text: string): Promise<{ items: ParsedItem[]; source: "ai" | "fallback" }> {
  if (isLlmConfigured()) {
    const raw = await chatCompletion([
      { role: "system", content: systemPrompt() },
      { role: "user", content: text },
    ]);
    const items = raw ? parseModelOutput(raw) : null;
    if (items && items.length > 0) return { items, source: "ai" };
  }
  return { items: splitShoppingText(text), source: "fallback" };
}
