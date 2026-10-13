/**
 * Geometría pura de la notificación. Todo lo que se llama desde un worklet lleva la
 * directiva "worklet" para correr en el hilo de UI.
 */
import {
  CANVAS_PADDING,
  CARD_GAP,
  CARD_HEIGHT,
  CARD_MARGIN,
  CARD_MAX_WIDTH,
  CARD_RADIUS,
  DROP_GROW_POWER,
  DROP_GROW_SPAN,
  DROP_SIZE,
  DROP_STRETCH,
  EDGE_MARGIN,
  ISLAND_HEIGHT,
  ISLAND_MIN_TOP,
  ISLAND_TOP,
  ISLAND_WIDTH,
  NECK_BREAK,
  NECK_FALL,
  NECK_RISE,
  NECK_WIDTH,
} from "./constants";

export interface NotificationLayout {
  width: number;
  centerX: number;
  islandWidth: number;
  islandHeight: number;
  islandTop: number;
  islandBottom: number;
  islandRadius: number;
  cardWidth: number;
  cardHeight: number;
  cardRadius: number;
  cardTop: number;
  cardLeft: number;
  cardCenterY: number;
  dropSize: number;
  neckWidth: number;
  canvasHeight: number;
}

export interface NotificationGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  neckX: number;
  neckY: number;
  neckWidth: number;
  neckHeight: number;
  neckRadius: number;
  shadowOpacity: number;
  offsetY: number;
  widthRatio: number;
}

export function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export function mix(progress: number, from: number, to: number): number {
  "worklet";
  return from + (to - from) * progress;
}

function easeOutPower(progress: number, power: number): number {
  "worklet";
  return 1 - Math.pow(1 - clamp(progress, 0, 1), power);
}

/** Campana asimétrica 0→1→0: el "cuello" que une la isla con la gota mientras cae. */
function neckProfile(progress: number, rise: number, fall: number): number {
  "worklet";
  const t = clamp(progress, 0, 1);
  if (t <= 0 || t >= 1) return 0;
  const peak = rise / (rise + fall);
  const normal = Math.pow(peak, rise) * Math.pow(1 - peak, fall);
  return (Math.pow(t, rise) * Math.pow(1 - t, fall)) / normal;
}

export function getLayout(width: number, insetTop: number): NotificationLayout {
  const islandTop = Math.max(insetTop - ISLAND_HEIGHT - ISLAND_TOP, ISLAND_MIN_TOP);
  const islandBottom = islandTop + ISLAND_HEIGHT;
  const cardWidth = Math.min(width - CARD_MARGIN * 2, CARD_MAX_WIDTH);
  const cardTop = islandBottom + CARD_GAP;

  return {
    width,
    centerX: width / 2,
    islandWidth: ISLAND_WIDTH,
    islandHeight: ISLAND_HEIGHT,
    islandTop,
    islandBottom,
    islandRadius: ISLAND_HEIGHT / 2,
    cardWidth,
    cardHeight: CARD_HEIGHT,
    cardRadius: CARD_RADIUS,
    cardTop,
    cardLeft: (width - cardWidth) / 2,
    cardCenterY: cardTop + CARD_HEIGHT / 2,
    dropSize: DROP_SIZE,
    neckWidth: NECK_WIDTH,
    canvasHeight: cardTop + CARD_HEIGHT + CANVAS_PADDING,
  };
}

/** `drop` y `expand` van de 0 a 1: primero cae la gota, después se abre en tarjeta. */
export function buildGeometry(drop: number, expand: number, layout: NotificationLayout): NotificationGeometry {
  "worklet";
  const grow = easeOutPower(drop / DROP_GROW_SPAN, DROP_GROW_POWER);
  const neck = neckProfile(drop / NECK_BREAK, NECK_RISE, NECK_FALL);

  const stretch = 1 + DROP_STRETCH * neck;
  const droplet = layout.dropSize * grow;

  const width = Math.min(mix(expand, droplet / stretch, layout.cardWidth), layout.width - EDGE_MARGIN * 2);
  const height = mix(expand, droplet * stretch, layout.cardHeight);
  const radius = Math.min(mix(expand, droplet * 0.5, layout.cardRadius), Math.min(width, height) / 2);

  const originY = layout.islandBottom - layout.islandHeight * 0.34;
  const centerY = mix(drop, originY, layout.cardCenterY);

  const neckWidth = Math.min(layout.neckWidth, width) * neck;
  const neckY = layout.islandBottom - layout.islandHeight * 0.5;

  return {
    x: layout.centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    radius,
    neckX: layout.centerX - neckWidth / 2,
    neckY,
    neckWidth,
    neckHeight: Math.max(centerY - neckY, 0),
    neckRadius: neckWidth / 2,
    shadowOpacity: clamp(expand, 0, 1),
    offsetY: centerY - layout.cardCenterY,
    widthRatio: layout.cardWidth > 0 ? width / layout.cardWidth : 0,
  };
}

/** Matriz de color que "pega" las formas desenfocadas (efecto gota/gooey). */
export function buildGooMatrix(gain: number, threshold: number): number[] {
  return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, gain, -gain * threshold];
}

/** `#RRGGBB` + alfa 0-1 → `#RRGGBBAA`. */
export function withAlpha(hex: string, alpha: number): string {
  const channel = Math.round(clamp(alpha, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex.slice(0, 7)}${channel}`;
}
