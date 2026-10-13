/** `#RRGGBB` + opacidad 0–1 → `#RRGGBBAA`. */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.min(Math.max(alpha, 0), 1);
  const channel = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex.slice(0, 7)}${channel}`;
}
