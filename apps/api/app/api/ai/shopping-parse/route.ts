import { assistantRequestSchema, type AssistantItem } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getProductFacets, searchProducts } from "@/lib/products";
import { parseShoppingText, type ParsedItem } from "@/lib/shoppingParse";

// El modelo grande puede tardar: con el límite por defecto (10 s) la función se cortaba.
export const maxDuration = 60;

const RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const MAX_BRANDS = 6;
const MAX_CANDIDATES = 5;
const CONCURRENCY = 4;

async function resolveItem(item: ParsedItem, index: number): Promise<AssistantItem> {
  let typeId = item.typeId;
  let candidates = await searchProducts(item.term, { type: typeId ?? undefined }, { withImages: false });
  // Si el tipo que dedujo la IA no tiene resultados, se prueba sin él.
  if (candidates.length === 0 && typeId) {
    typeId = null;
    candidates = await searchProducts(item.term, {}, { withImages: false });
  }
  const facets = await getProductFacets(item.term, { type: typeId ?? undefined });
  return {
    id: `item-${index}`,
    term: item.term,
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

  const { items, source } = await parseShoppingText(parsed.data.text);
  if (items.length === 0) {
    return NextResponse.json({ error: "NOTHING_UNDERSTOOD" }, { status: 422 });
  }

  const resolved = await mapWithLimit(items, CONCURRENCY, resolveItem);
  return NextResponse.json({ items: resolved, source });
}
