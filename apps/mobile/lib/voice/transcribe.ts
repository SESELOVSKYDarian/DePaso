import { File } from "expo-file-system";
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

/** Acorta el mensaje de un error de red para mostrarlo como código (sin rutas ni datos). */
function shortReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/file:\/\/\S+/g, "file").replace(/\s+/g, " ").slice(0, 60);
}

/**
 * Manda la grabación al servidor (`/api/ai/transcribe`) y devuelve el texto. El servidor
 * reenvía el audio al servicio de voz a texto y lo descarta: no se guarda.
 *
 * Expo reemplaza el `fetch` global por `expo/fetch`, que NO acepta el archivo local de React
 * Native (`{ uri, name, type }`) dentro de un `FormData`: hay que adjuntar un `File` de
 * `expo-file-system`, que es el que sabe leer los bytes del archivo.
 */
export async function transcribeRecording(uri: string): Promise<string> {
  const token = await getStoredToken();

  const form = new FormData();
  try {
    form.append("file", new File(uri) as unknown as Blob);
  } catch (error) {
    throw new TranscribeError("failed", `file_read:${shortReason(error)}`);
  }

  let response: Response;
  try {
    // Sin Content-Type: fetch arma el multipart con su boundary.
    response = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch (error) {
    throw new TranscribeError("failed", `no_connection:${shortReason(error)}`);
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
