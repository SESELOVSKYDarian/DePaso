/**
 * SEPA no publica categoría ni unidad/cantidad estructurada de producto — sólo
 * `productos_descripcion` en texto libre (ej. "PROT SOL RAYITO KIDS F50 X150GR"). Esto es
 * NO DEFINIDO en la fuente (no un dato que el prompt original haya podido anticipar bien);
 * se extrae con un heurístico best-effort, documentado como tal — no es una clasificación
 * exacta (sección 8 pide normalizar unidades, no da el algoritmo).
 */
const UNIT_SYNONYMS: Record<string, string> = {
  ml: "ml",
  cc: "ml",
  l: "L",
  lt: "L",
  ltr: "L",
  g: "g",
  gr: "g",
  grs: "g",
  kg: "kg",
  kgm: "kg",
  un: "un",
  unid: "un",
};

/** Alternativas ordenadas de más específica a menos (sección 8) — confirmado real contra
 * descripciones de SEPA Minorista: "LTR"/"KGM" son abreviaturas reales que no estaban acá
 * al principio (encontradas probando la búsqueda de productos con datos de SEPA de
 * verdad, no hipotéticas) y deben probarse antes que su prefijo más corto ("lt"/"kg") o el
 * `\b` después del match corto falla contra la letra siguiente y no matchea nada. */
const UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(ltr|lt|l|kgm|kg|grs|gr|g|ml|cc|unid|un)\b/i;

export interface ExtractedUnit {
  unit: string;
  unitSize: number;
}

export function extractUnitFromDescription(description: string): ExtractedUnit {
  const match = description.toLowerCase().match(UNIT_PATTERN);
  if (!match) {
    // Fallback documentado — sin patrón reconocible, se asume 1 unidad suelta.
    return { unit: "un", unitSize: 1 };
  }
  const rawSize = match[1]!.replace(",", ".");
  const rawUnit = match[2]!.toLowerCase();
  return { unit: UNIT_SYNONYMS[rawUnit] ?? rawUnit, unitSize: Number(rawSize) };
}

/** Categoría SEPA no clasifica — placeholder explícito en vez de inventar una taxonomía
 * (sección 75, "no inventar"). Un admin puede recategorizar manualmente más adelante. */
export const UNCATEGORIZED_LABEL = "Sin categorizar (SEPA)";
