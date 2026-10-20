/**
 * Voz a texto con un servicio compatible con la API de OpenAI (`/audio/transcriptions`):
 * Groq (Whisper, tiene capa gratis), OpenAI, etc.
 *
 * Variables: `STT_API_KEY` (obligatoria), `STT_BASE_URL` (por defecto Groq) y `STT_MODEL`
 * (por defecto `whisper-large-v3-turbo`). Sin clave `isSttConfigured()` da `false`.
 */
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "whisper-large-v3-turbo";
const REQUEST_TIMEOUT_MS = 30_000;

/** Pista de vocabulario: mejora mucho el reconocimiento de marcas y productos de góndola. */
const VOCABULARY_HINT =
  "Lista de compras de supermercado en Argentina: leche, yerba, gaseosa, fideos, arroz, aceite, galletitas, queso, Coca-Cola, Taragüí, La Serenísima.";

export function isSttConfigured(): boolean {
  return Boolean(process.env.STT_API_KEY?.trim());
}

export type TranscribeResult = { ok: true; text: string } | { ok: false; reason: "not_configured" | "failed" };

export async function transcribeAudio(file: Blob, filename: string): Promise<TranscribeResult> {
  const apiKey = process.env.STT_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: "not_configured" };

  const baseUrl = (process.env.STT_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const form = new FormData();
  form.append("file", file, filename);
  form.append("model", process.env.STT_MODEL?.trim() || DEFAULT_MODEL);
  form.append("language", "es");
  form.append("response_format", "json");
  form.append("temperature", "0");
  form.append("prompt", VOCABULARY_HINT);

  try {
    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("stt request rejected", response.status);
      return { ok: false, reason: "failed" };
    }
    const body = (await response.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    return text ? { ok: true, text } : { ok: false, reason: "failed" };
  } catch (error) {
    console.error("stt request failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, reason: "failed" };
  }
}
