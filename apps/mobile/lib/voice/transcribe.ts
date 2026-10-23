import { API_BASE_URL } from "../config";
import { getStoredToken } from "../auth/secureStore";

export type TranscribeFailure = "not_configured" | "too_large" | "rate_limited" | "failed";

export class TranscribeError extends Error {
  /**
   * @param detail Código corto de la causa (`upstream_401`, `empty_transcript`, `http_400`…).
   * Se muestra en pantalla para poder diagnosticar sin mirar los logs del servidor.
   */
  constructor(
    public reason: TranscribeFailure,
    public detail?: string,
  ) {
    super(`transcribe:${reason}${detail ? `:${detail}` : ""}`);
  }
}

/**
 * Manda la grabación al servidor (`/api/ai/transcribe`) y devuelve el texto. El servidor
 * reenvía el audio al servicio de voz a texto y lo descarta: no se guarda.
 */
export async function transcribeRecording(uri: string): Promise<string> {
  const token = await getStoredToken();
  const form = new FormData();
  // En React Native un archivo local se adjunta como { uri, name, type }.
  form.append("file", { uri, name: "audio.m4a", type: "audio/m4a" } as unknown as Blob);

  let response: Response;
  try {
    // Sin Content-Type: fetch arma el multipart con su boundary.
    response = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw new TranscribeError("failed", "no_connection");
  }

  if (response.ok) {
    const body = (await response.json().catch(() => null)) as { text?: unknown } | null;
    if (typeof body?.text === "string" && body.text.trim()) return body.text.trim();
    throw new TranscribeError("failed", "empty_response");
  }

  const body = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
  if (body?.error === "STT_NOT_CONFIGURED") throw new TranscribeError("not_configured");
  if (body?.error === "AUDIO_TOO_LARGE") throw new TranscribeError("too_large");
  if (body?.error === "RATE_LIMITED") throw new TranscribeError("rate_limited");
  throw new TranscribeError("failed", body?.detail ?? `${body?.error ?? "http"}_${response.status}`);
}
