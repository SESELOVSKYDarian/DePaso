import { Platform, useWindowDimensions } from "react-native";

/**
 * Escala de la interfaz en la web. Los tamaños de DePaso (letras, botones, espacios) están
 * pensados para un celular; en una pantalla de computadora quedaban diminutos y perdidos. Desde
 * cierto ancho se agranda todo en proporción, como si el navegador tuviera zoom, de modo que el
 * ancho "efectivo" ronda siempre los 1360 px: una pantalla de 1920 se ve con todo ~40 % más grande.
 * En el celular, la tablet y el celular acostado no se toca nada.
 */
const BASE_WIDTH = 1360;
const MAX_SCALE = 1.9;
const MIN_WIDTH_TO_SCALE = 1100;

export function webScaleFor(width: number): number {
  if (Platform.OS !== "web" || width < MIN_WIDTH_TO_SCALE) return 1;
  const scale = Math.round((width / BASE_WIDTH) * 20) / 20;
  return Math.min(MAX_SCALE, Math.max(1, scale));
}

/** Aplica la escala a toda la página (también a los carteles, que viven fuera de la app). Devuelve cómo deshacerlo. */
export function installWebScale(): () => void {
  if (Platform.OS !== "web" || typeof window === "undefined") return () => undefined;
  const root = document.documentElement;
  const apply = () => {
    const scale = webScaleFor(window.innerWidth);
    root.style.setProperty("zoom", scale === 1 ? "" : String(scale));
  };
  apply();
  window.addEventListener("resize", apply);
  return () => {
    window.removeEventListener("resize", apply);
    root.style.setProperty("zoom", "");
  };
}

/**
 * Tamaño de ventana "efectivo": el real dividido por la escala. Es el que hay que usar para decidir
 * cuántas columnas entran, ya que el contenido se dibuja ya agrandado.
 */
export function useEffectiveWindow(): { width: number; height: number; scale: number } {
  const { width, height } = useWindowDimensions();
  const scale = webScaleFor(width);
  return { width: width / scale, height: height / scale, scale };
}
