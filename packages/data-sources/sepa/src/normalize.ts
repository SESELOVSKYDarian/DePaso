/**
 * Normalización de productos (sección 8) — un mismo producto viene escrito distinto entre
 * comercios ("Leche La Serenisima Ent x1L" / "LECHE ENT.LA SERENISIMA 1LT"). El nombre
 * normalizado es una señal de matching secundaria; el EAN validado tiene prioridad.
 */
export function normalizeProductName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Valida el dígito verificador GTIN (EAN-8/12/13/14) — algoritmo módulo 10 estándar.
 * Corrección al supuesto original del prompt (sección 6/7): `productos_ean` de SEPA no es
 * un indicador booleano de "es EAN real", repite el mismo valor de `id_producto` sea o no
 * un GTIN válido (confirmado contra el feed real, docs/data/SEPA.md) — por eso la
 * confirmación se hace acá, con el checksum, no leyendo un campo que no existe con ese
 * significado.
 */
export function isValidGtinChecksum(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;

  const digits = code.split("").map(Number);
  const checkDigit = digits[digits.length - 1]!;
  const payload = digits.slice(0, -1).reverse();

  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    sum += payload[i]! * (i % 2 === 0 ? 3 : 1);
  }
  const computedCheckDigit = (10 - (sum % 10)) % 10;
  return computedCheckDigit === checkDigit;
}
