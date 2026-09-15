/**
 * Sección 15 — SEPA trae `sucursales_localidad` inconsistente ("Mar del Plata" / "MAR DEL
 * PLATA" / "Mar Del Plata", confirmado contra el feed real). Normaliza a minúsculas, sin
 * acentos, espacios colapsados, para poder comparar contra `localityAliases`.
 */
export function normalizeLocality(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
