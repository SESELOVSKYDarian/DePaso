/**
 * Rate limit en memoria — sección 81 (rate limits). Valores numéricos no definidos en la
 * documentación (FUNCTIONAL.md, NO DEFINIDO); elección MVP razonable, a recalibrar con
 * datos reales.
 *
 * Limitación conocida: vive en memoria del proceso — sirve para un único servidor Node en
 * dev/MVP, no protege un deploy multi-instancia (ahí hace falta un store compartido tipo
 * Redis). Documentado acá para no confundirlo con protección real de producción a escala.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
}

/** Sólo para tests — evita que el estado de un test contamine el siguiente. */
export function resetRateLimitStateForTests(): void {
  buckets.clear();
}
