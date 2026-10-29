/**
 * Cliente mínimo para un LLM con API compatible con OpenAI (`/v1/chat/completions`).
 *
 * Variables: `LLM_API_KEY` (obligatoria), `LLM_BASE_URL` (por defecto el servidor de Enigma) y
 * `LLM_MODEL` (por defecto `enigma-27b`). Sin clave `isLlmConfigured()` da `false` y quien lo
 * usa debe caer a una alternativa sin IA.
 */
const DEFAULT_BASE_URL = "https://llm.enigma-it.com.ar/v1";
const DEFAULT_MODEL = "enigma-27b";
const REQUEST_TIMEOUT_MS = 25_000;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim());
}

/** Pide una respuesta de chat (sin streaming) y devuelve el texto, o `null` si falló. */
export async function chatCompletion(messages: ChatMessage[], options: { maxTokens?: number } = {}): Promise<string | null> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) return null;

  const baseUrl = (process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.LLM_MODEL?.trim() || DEFAULT_MODEL,
        messages,
        temperature: 0.1,
        max_tokens: options.maxTokens ?? 700,
        stream: false,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      // No se registra el cuerpo: puede incluir texto del usuario.
      console.error("llm request rejected", response.status);
      return null;
    }
    const body = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = body.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (error) {
    console.error("llm request failed", error instanceof Error ? error.name : "unknown");
    return null;
  }
}

/** Saca el primer objeto JSON de una respuesta, aunque venga con ```json o texto alrededor. */
export function extractJsonObject(raw: string): unknown {
  const withoutFences = raw.replace(/```(?:json)?/gi, "");
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(withoutFences.slice(start, end + 1));
  } catch {
    return null;
  }
}
