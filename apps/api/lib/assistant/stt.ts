/**
 * Voz a texto con un servicio compatible con la API de OpenAI (`/audio/transcriptions`):
 * Groq (Whisper, tiene capa gratis), OpenAI, etc.
 *
 * Variables: `STT_API_KEY` (obligatoria), `STT_BASE_URL` (por defecto Groq) y `STT_MODEL`
 * (por defecto `whisper-large-v3`). Sin clave `isSttConfigured()` da `false`.
 */
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
// El modelo completo entiende mejor marcas y acentos que el "turbo", que es el más rápido pero menos fino.
const DEFAULT_MODEL = "whisper-large-v3";
const REQUEST_TIMEOUT_MS = 30_000;
/** Whisper sólo mira ~224 tokens de la pista: se corta antes para no desperdiciar el resto. */
const MAX_HINT_CHARS = 700;

const BASE_HINT = "Lista de compras de supermercado en Argentina: leche, yerba, gaseosa, fideos, arroz, aceite, galletitas, chocolate, queso.";

/**
 * Pista de vocabulario: Whisper la toma como "el texto que venía antes", así que escribe las marcas
 * tal como figuran acá ("Águila" en vez de "ayla"). `brands` son las del catálogo, de más a menos conocidas.
 */
export function buildVocabularyHint(brands: string[] = []): string {
  let hint = BASE_HINT;
  if (brands.length === 0) return `${hint} Marcas: Coca-Cola, Taragüí, La Serenísima, Águila.`;
  hint += " Marcas:";
  for (const brand of brands) {
    const next = `${hint} ${brand},`;
    if (next.length > MAX_HINT_CHARS) break;
    hint = next;
  }
  return hint.replace(/,$/, ".");
}

export function isSttConfigured(): boolean {
  return Boolean(process.env.STT_API_KEY?.trim());
}

/**
 * Por qué falló, en un código corto que la app puede mostrar y que sirve para diagnosticar:
 *  - `upstream_401`/`upstream_403`: la clave de voz es inválida o no tiene permiso;
 *  - `upstream_400`: el servicio rechazó el audio (formato o archivo vacío);
 *  - `upstream_429`: se pasó el límite del servicio;
 *  - `upstream_5xx`: caída del servicio de voz;
 *  - `empty_transcript`: se transcribió, pero no se escuchó voz (silencio);
 *  - `network`: no se pudo llegar al servicio.
 */
export type TranscribeFailureDetail =
  | `upstream_${number}`
  | "empty_transcript"
  | "network";

export type TranscribeResult =
  | { ok: true; text: string }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "failed"; detail: TranscribeFailureDetail };

export async function transcribeAudio(file: Blob, filename: string, vocabularyHint?: string): Promise<TranscribeResult> {
  const apiKey = process.env.STT_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "not_configured" };

  const baseUrl = (process.env.STT_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const form = new FormData();
  form.append("file", file, filename);
  form.append("model", process.env.STT_MODEL?.trim() || DEFAULT_MODEL);
  form.append("language", "es");
  form.append("response_format", "json");
  form.append("temperature", "0");
  form.append("prompt", vocabularyHint ?? buildVocabularyHint());

  try {
    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      // El mensaje del servicio de voz describe el problema (clave, formato…) y no incluye el audio.
      const message = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
      console.error("stt request rejected", response.status, message);
      return { ok: false, reason: "failed", detail: `upstream_${response.status}` };
    }
    const body = (await response.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      console.error("stt returned an empty transcript", { bytes: file.size, type: file.type });
      return { ok: false, reason: "failed", detail: "empty_transcript" };
    }
    return { ok: true, text };
  } catch (error) {
    console.error("stt request failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, reason: "failed", detail: "network" };
  }
}
