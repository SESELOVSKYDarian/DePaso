/** "ahora", "hace 5 min", "hace 3 h", "ayer", "hace 4 días", o la fecha si pasó más de una semana. */
export function formatRelativeTime(from: number | string | Date, now: number = Date.now()): string {
  const time = from instanceof Date ? from.getTime() : typeof from === "number" ? from : Date.parse(from);
  if (Number.isNaN(time)) return "";
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 45) return "ahora";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return new Date(time).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
