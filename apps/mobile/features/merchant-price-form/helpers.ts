/** Convierte lo escrito ("1.250,50" o "1250.5") en un número mayor a 0, o `null` si no sirve. */
export function parsePrice(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}
