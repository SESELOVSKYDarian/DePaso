/**
 * Constantes de las notificaciones estilo "Dynamic Island". Geometría y tiempos portados de
 * expo-dynamic-notifications (rit3zh, MIT) y ajustados a DePaso: tarjeta más alta para dos
 * líneas de texto, sombra con el navy de marca y springs por `dampingRatio` (Reanimated 4).
 */
import type { WithSpringConfig } from "react-native-reanimated";

export const ISLAND_WIDTH = 126;
export const ISLAND_HEIGHT = 37.33;
export const ISLAND_TOP = 11;
export const ISLAND_MIN_TOP = 12;
export const CARD_MAX_WIDTH = 396;
export const CARD_HEIGHT = 78;
export const CARD_RADIUS = 30;
export const CARD_MARGIN = 16;
export const CARD_GAP = 30;
export const DROP_SIZE = 52;
export const NECK_WIDTH = 60;
export const CANVAS_PADDING = 96;
export const EDGE_MARGIN = 10;

export const GOO_BLUR = 14;
export const GOO_GAIN = 22;
export const GOO_THRESHOLD = 0.43;
export const GOO_INSET_RATIO = 0.26;

export const DROP_GROW_SPAN = 0.7;
export const DROP_GROW_POWER = 1.25;
export const DROP_STRETCH = 0.38;
export const NECK_BREAK = 0.82;
export const NECK_RISE = 1.6;
export const NECK_FALL = 1.4;
export const DROP_TINT_START = 0.06;
export const DROP_TINT_END = 0.88;
/** La "isla" se vuelve visible durante el primer tramo de la caída. */
export const ISLAND_FADE_SPAN = 0.12;

export const CONTENT_MIN_SCALE = 0.9;
export const SHADOW_DY = 10;
export const SHADOW_BLUR = 14;

export const ENTER_TINT_DELAY = 110;
export const ENTER_EXPAND_DELAY = 340;
export const ENTER_REVEAL_DELAY = 560;
export const EXIT_COLLAPSE_DELAY = 100;
export const EXIT_DROP_DELAY = 280;
export const AUTO_DISMISS = 3200;

export const SWIPE_DISTANCE = -18;
export const SWIPE_VELOCITY = -420;
export const EXIT_ANTICIPATION_VELOCITY = 2;

export const REDUCED_MOTION_FADE_MS = 160;

export const PALETTE = {
  island: "#000000",
  card: "#FFFFFF",
  shadow: "rgba(26, 19, 65, 0.22)",
} as const;

export const DROP_SPRING: WithSpringConfig = { duration: 1150, dampingRatio: 0.82 };
export const EXPAND_SPRING: WithSpringConfig = { duration: 1000, dampingRatio: 0.8 };
export const REVEAL_SPRING: WithSpringConfig = { duration: 700, dampingRatio: 1 };
export const TINT_SPRING: WithSpringConfig = { duration: 700, dampingRatio: 1 };
export const COLLAPSE_SPRING: WithSpringConfig = {
  duration: 660,
  dampingRatio: 0.92,
  velocity: EXIT_ANTICIPATION_VELOCITY,
};
export const RETURN_SPRING: WithSpringConfig = { duration: 1150, dampingRatio: 0.9 };
export const FADE_SPRING: WithSpringConfig = { duration: 360, dampingRatio: 1 };
export const DRAG_SPRING: WithSpringConfig = { duration: 560, dampingRatio: 0.7 };
