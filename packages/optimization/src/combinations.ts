import type { StoreCandidateInput } from "./types";

function kCombinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];

  const [first, ...rest] = items as [T, ...T[]];
  const withFirst = kCombinations(rest, k - 1).map((combo) => [first, ...combo]);
  const withoutFirst = kCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

/**
 * Genera combinaciones de 1 a `maxStops` comercios a partir de los candidatos ya
 * filtrados por corredor de ruta (sección 64: no generar combinaciones exponenciales sin
 * filtro previo). Los comercios REQUIRED se fuerzan en toda combinación — restricción
 * obligatoria aplicada antes del ranking (BUSINESS-RULES.md).
 */
export function generateStoreCombinations(
  candidates: StoreCandidateInput[],
  requiredStoreBranchIds: Set<string>,
  maxStops = 3
): StoreCandidateInput[][] {
  const required = candidates.filter((c) => requiredStoreBranchIds.has(c.storeBranchId));
  const optional = candidates.filter((c) => !requiredStoreBranchIds.has(c.storeBranchId));

  if (required.length >= maxStops) {
    return required.length > 0 ? [required] : [];
  }

  const remainingSlots = maxStops - required.length;
  const combos: StoreCandidateInput[][] = [];

  for (let k = 0; k <= remainingSlots; k++) {
    if (required.length === 0 && k === 0) continue; // evitar combo vacía
    for (const subset of kCombinations(optional, k)) {
      combos.push([...required, ...subset]);
    }
  }

  return combos;
}
