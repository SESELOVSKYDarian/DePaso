import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { topBrandNames } from "@/lib/brandVocabulary";
import { buildVocabularyHint, isSttConfigured, transcribeAudio } from "@/lib/stt";

export const maxDuration = 60;

const RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
/** ~1 minuto de audio AAC ronda 0,5-1 MB; Vercel corta los cuerpos de más de 4,5 MB. */
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

/**
 * `POST /api/ai/transcribe` (multipart, campo `file`) - pasa un audio corto a texto para el
 * asistente de compras. El audio no se guarda: se reenvía al servicio de voz y se descarta.
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(`transcribe:${current.userId}`, RATE_LIMIT.max, RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  if (!isSttConfigured()) {
    return NextResponse.json({ error: "STT_NOT_CONFIGURED" }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "AUDIO_TOO_LARGE" }, { status: 413 });
  }

  const name = file instanceof File && file.name ? file.name : "audio.m4a";
  // Las marcas del catálogo van como pista: así "Águila" sale escrito "Águila" y no "ayla".
  const hint = buildVocabularyHint(await topBrandNames(60));
  const result = await transcribeAudio(file, name, hint);
  if (!result.ok) {
    if (result.reason === "not_configured") {
      return NextResponse.json({ error: "STT_NOT_CONFIGURED" }, { status: 503 });
    }
    // `detail` dice por qué falló (clave inválida, audio vacío, silencio…) para poder mostrarlo.
    return NextResponse.json({ error: "TRANSCRIPTION_FAILED", detail: result.detail }, { status: 502 });
  }
  return NextResponse.json({ text: result.text.slice(0, 800) });
}
