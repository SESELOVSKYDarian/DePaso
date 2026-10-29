/** Fecha local "AAAA-MM-DD": sirve para saber si un recorrido guardado todavía es de hoy. */
export function dayStamp(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Milisegundos que faltan para las 00:00 del día siguiente (hora del celular). */
export function msUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}
