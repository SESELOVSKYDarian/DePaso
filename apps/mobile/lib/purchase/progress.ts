/** Cómo va un producto de la compra: cuántas unidades se compraron y si en el comercio no había más. */
export interface ItemProgress {
  bought: number;
  soldOut: boolean;
}

/** Un producto está resuelto cuando se compró todo lo pedido o cuando en el comercio no había más. */
export function isItemDone(progress: ItemProgress | undefined, quantity: number): boolean {
  return progress !== undefined && (progress.soldOut || progress.bought >= quantity);
}

/** Cuántas unidades faltan conseguir. */
export function missingUnits(progress: ItemProgress | undefined, quantity: number): number {
  return Math.max(0, quantity - (progress?.bought ?? 0));
}

/** Deja la cantidad comprada entre 0 y lo pedido, siempre entera. */
export function clampBought(value: number, quantity: number): number {
  return Math.min(quantity, Math.max(0, Math.round(value)));
}

/** "450 m" o "1,2 km", para decir a qué distancia queda un comercio. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}