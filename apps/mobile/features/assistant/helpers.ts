import { ApiError } from "@depaso/api-client";
import { transcribeRecording, TranscribeError } from "@/lib/voice/transcribe";

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatClock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function parseErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "RATE_LIMITED") return "Pediste muchas listas seguidas. Probá de nuevo en unos minutos.";
    if (code === "NOTHING_UNDERSTOOD") return "No entendimos qué necesitás. Probá nombrando los productos.";
    return `No pudimos armar tu lista (error ${error.status}). Probá de nuevo.`;
  }
  return "No pudimos conectar. Revisá tu conexión e intentá de nuevo.";
}

export function voiceErrorMessage(error: unknown): string {
  if (error instanceof TranscribeError) {
    if (error.reason === "not_configured") return "La voz todavía no está activada en el servidor. Podés escribirlo.";
    if (error.reason === "rate_limited") return "Hiciste muchos pedidos seguidos. Probá de nuevo en unos minutos.";
    if (error.reason === "too_large") return "El audio quedó muy largo. Probá con una lista más corta.";

    const detail = error.detail ?? "";
    const code = detail ? ` (código: ${detail})` : "";
    if (detail === "empty_transcript") return "No te escuchamos. Hablá más cerca del micrófono y probá de nuevo.";
    if (detail === "upstream_401" || detail === "upstream_403") {
      return `El servicio de voz rechazó la clave. Escribilo por ahora${code}.`;
    }
    if (detail === "upstream_429") return `El servicio de voz está saturado. Probá en un minuto${code}.`;
    if (detail.startsWith("no_connection") || detail === "network") {
      return `No pudimos conectar con el servidor. Revisá tu conexión${code}.`;
    }
    if (detail.startsWith("file_read")) {
      return `No pudimos leer la grabación. Probá de nuevo${code}.`;
    }
    return `No pudimos entender el audio. Probá de nuevo o escribilo${code}.`;
  }
  return "No pudimos entender el audio. Probá de nuevo o escribilo.";
}

export const MIC_SIZE = 112;
