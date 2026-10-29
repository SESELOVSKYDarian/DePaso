/**
 * Los nombres de SEPA llegan en MAYÚSCULAS y truncados ("ARROZ DOBLE CAROLINA BOLS"): se
 * pasan a "Arroz doble carolina bols" para que la lista de compras no parezca un ticket
 * de caja. Los nombres que ya vienen en mixto ("Leche S&P entera tb x1lt") no se tocan.
 */
export function prettifyProductName(name: string): string {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (!isMostlyUppercase(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** "GALLO ORO" → "Gallo Oro". Las marcas que ya vienen en mixto se dejan como están. */
export function prettifyBrandName(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (!isMostlyUppercase(trimmed)) return trimmed;
  return trimmed
    .toLowerCase()
    .split(" ")
    .map((word) => (word.length <= 2 && /^[a-z]+$/.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

function isMostlyUppercase(text: string): boolean {
  const letters = text.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, "").length;
  return upper / letters.length >= 0.7;
}
