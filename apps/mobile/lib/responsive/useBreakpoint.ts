import { useWindowDimensions } from "react-native";

/** Ancho desde el cual se considera tablet / pantalla grande (también un celu en horizontal grande). */
export const TABLET_MIN_WIDTH = 768;
/** Ancho desde el cual el menú pasa a la izquierda (escritorio). */
export const DESKTOP_MIN_WIDTH = 1024;
/** Ancho máximo del contenido en pantallas grandes: más que esto se lee mal. */
export const CONTENT_MAX_WIDTH = 1100;

/**
 * Tamaño de pantalla actual. Se actualiza solo al girar el celular o cambiar el tamaño de
 * la ventana en la web.
 */
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isLandscape: width > height,
    isTablet: width >= TABLET_MIN_WIDTH,
    isDesktop: width >= DESKTOP_MIN_WIDTH,
  };
}
