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
/** Tope de claves en memoria: un atacante que invente IPs no puede llenar la memoria del servidor. */
const MAX_BUCKETS = 50_000;
let lastSweep = 0;

/** Borra las ventanas vencidas (como mucho una vez por minuto) y, si igual hay demasiadas, las más viejas. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000 && buckets.size < MAX_BUCKETS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  if (buckets.size >= MAX_BUCKETS) {
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (buckets.size < MAX_BUCKETS * 0.8) break;
    }
  }
}

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
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
