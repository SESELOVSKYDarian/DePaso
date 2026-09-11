/**
 * Formateo de copy humano (sección 21/46/63/66 del master prompt) — nunca exponer números
 * técnicos crudos ("0,82 km", "score 0.376"). Español rioplatense, sin decimales en plata.
 */

export function formatMoney(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  return `$${rounded.toLocaleString("es-AR")}`;
}

export function formatDeviation(meters: number): string {
  if (meters < 950) {
    return `${Math.round(meters / 10) * 10} m`;
  }
  const km = meters / 1000;
  return `${km.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km`;
}

export function formatMinutes(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  return `${minutes} min`;
}
