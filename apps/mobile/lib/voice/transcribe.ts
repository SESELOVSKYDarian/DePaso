import { API_BASE_URL } from "../config";
import { getStoredToken } from "../auth/secureStore";

export type TranscribeFailure = "not_configured" | "too_large" | "rate_limited" | "failed";

export class TranscribeError extends Error {
  constructor(public reason: TranscribeFailure) {
    super(`transcribe:${reason}`);
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
    throw new TranscribeError("failed");
  }

  if (response.ok) {
    const body = (await response.json().catch(() => null)) as { text?: unknown } | null;
    if (typeof body?.text === "string" && body.text.trim()) return body.text.trim();
    throw new TranscribeError("failed");
  }
  const code = ((await response.json().catch(() => null)) as { error?: string } | null)?.error;
  if (code === "STT_NOT_CONFIGURED") throw new TranscribeError("not_configured");
  if (code === "AUDIO_TOO_LARGE") throw new TranscribeError("too_large");
  if (code === "RATE_LIMITED") throw new TranscribeError("rate_limited");
  throw new TranscribeError("failed");
}
