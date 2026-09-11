import type { PlaceType } from "@depaso/types";

/** Emoji + label en español por tipo de lugar — mismo criterio visual que el Home
 * (sección 33: "🏠 Casa", "💼 Trabajo", "🎓 Facultad", "🏋 Gimnasio"). */
export const PLACE_TYPE_META: Record<PlaceType, { emoji: string; label: string }> = {
  HOME: { emoji: "🏠", label: "Casa" },
  WORK: { emoji: "💼", label: "Trabajo" },
  STUDY: { emoji: "🎓", label: "Estudio" },
  GYM: { emoji: "🏋", label: "Gimnasio" },
  FAMILY: { emoji: "👪", label: "Familia" },
  CUSTOM: { emoji: "📍", label: "Otro" },
};

export const PLACE_TYPES: PlaceType[] = ["HOME", "WORK", "STUDY", "GYM", "FAMILY", "CUSTOM"];
