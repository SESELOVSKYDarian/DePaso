import { assistantRequestSchema, type AssistantItem } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { loadBrands, topBrandNames } from "@/lib/catalog/brandVocabulary";
import { correctBrandInTerm, stripAccents, type BrandEntry } from "@/lib/catalog/phonetic";
import { prettifyBrandName } from "@/lib/catalog/productNames";
import { getProductFacets, searchProducts } from "@/lib/catalog/products";
import { parseShoppingText, type ParsedItem } from "@/lib/assistant/shoppingParse";

// El modelo grande puede tardar: con el límite por defecto (10 s) la función se cortaba.
export const maxDuration = 60;

const RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const MAX_BRANDS = 6;
const MAX_CANDIDATES = 5;
const CONCURRENCY = 4;
/** Marcas que se le muestran a la IA para corregir lo mal dictado (más largas = más tokens y más lento). */
const PROMPT_BRANDS = 120;

async function resolveItem(item: ParsedItem, index: number, brands: BrandEntry[]): Promise<AssistantItem> {
  let term = item.term;
  let typeId = item.typeId;
  let candidates = await searchProducts(term, { type: typeId ?? undefined }, { withImages: false });
  // Si el tipo que dedujo la IA no tiene resultados, se prueba sin él.
  if (candidates.length === 0 && typeId) {
    typeId = null;
    candidates = await searchProducts(term, {}, { withImages: false });
  }

  // Sin resultados: la marca quizás se transcribió mal ("chocolate ayla" por "chocolate Águila").
  // Se busca la marca que suena parecido y se reintenta con ella.
  if (candidates.length === 0) {
    const correction = correctBrandInTerm(term, brands, () => false);
    if (correction) {
      const rest = stripAccents(term)
        .split(/\s+/)
        .filter((word) => word && word !== correction.term)
        .join(" ");
      candidates = await searchProducts(rest, { type: typeId ?? undefined, brandId: correction.brand.id }, { withImages: false });
      if (candidates.length === 0 && typeId) {
        typeId = null;
        candidates = await searchProducts(rest, { brandId: correction.brand.id }, { withImages: false });
      }
      if (candidates.length > 0) {
        term = [rest, (prettifyBrandName(correction.brand.name) ?? correction.brand.name).toLowerCase()].filter(Boolean).join(" ");
      }
    }
  }

  // Todavía nada: se prueba sólo con la primera palabra (el producto) para que al menos se pueda sumar algo.
  if (candidates.length === 0) {
    const first = stripAccents(term).split(/\s+/).find((word) => word.length >= 3);
    if (first && first !== stripAccents(term)) {
      candidates = await searchProducts(first, { type: typeId ?? undefined }, { withImages: false });
    }
  }

  const facets = await getProductFacets(term, { type: typeId ?? undefined });
  return {
    id: `item-${index}`,
    term,
    quantity: item.quantity,
    typeId,
    brands: facets.brands.slice(0, MAX_BRANDS),
    candidates: candidates.slice(0, MAX_CANDIDATES),
  };
}

async function mapWithLimit<T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let index = next++; index < items.length; index = next++) {
      results[index] = await task(items[index]!, index);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * `POST /api/ai/shopping-parse` - convierte "necesito leche, 2 gaseosas y yerba" en ítems con
 * los candidatos y las marcas de cada uno, para que la app pregunte "¿de qué marca?".
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(`assistant:${current.userId}`, RATE_LIMIT.max, RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const parsed = assistantRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const [brands, brandNames] = await Promise.all([loadBrands(), topBrandNames(PROMPT_BRANDS)]);
  const { items, source } = await parseShoppingText(parsed.data.text, brandNames);
  if (items.length === 0) {
    return NextResponse.json({ error: "NOTHING_UNDERSTOOD" }, { status: 422 });
  }

  const resolved = await mapWithLimit(items, CONCURRENCY, (item, index) => resolveItem(item, index, brands));
  return NextResponse.json({ items: resolved, source });
}
