/**
 * Si el mismo producto está dos veces en la lista (por ejemplo, sumado en dos momentos), se
 * junta en un solo renglón con la cantidad total: así el plan y "Mejores precios" lo muestran
 * una vez, con el precio por unidad y la cantidad que corresponde.
 */
export function mergeDuplicateItems<T extends { productId: string; quantity: number }>(items: T[]): T[] {
  const byProduct = new Map<string, T>();
  for (const item of items) {
    const existing = byProduct.get(item.productId);
    if (existing) {
      byProduct.set(item.productId, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      byProduct.set(item.productId, item);
    }
  }
  return [...byProduct.values()];
}
