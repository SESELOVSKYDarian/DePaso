import { useEffectiveWindow } from "@/lib/web/webScale";

/** Ancho desde el cual se considera tablet / pantalla grande (también un celu en horizontal grande). */
export const TABLET_MIN_WIDTH = 768;
/** Ancho desde el cual se considera escritorio. */
export const DESKTOP_MIN_WIDTH = 1024;
/** Ancho de lectura cómoda para formularios y pantallas de una sola columna. */
export const READING_MAX_WIDTH = 920;
/** Ancho máximo del contenido en pantallas enormes (más allá, las líneas se vuelven ilegibles). */
export const WIDE_MAX_WIDTH = 1600;
/** Ancho del menú lateral en escritorio. */
export const SIDE_NAV_WIDTH = 240;

/**
 * Tamaño de pantalla actual. Se actualiza solo al girar el celular o cambiar el tamaño de
 * la ventana en la web.
 *
 * - `hasSideNav`: el menú va a la izquierda. Pasa en escritorio y también con el celular acostado
 *   (a lo largo sobra ancho y falta alto: el menú de abajo se comería media pantalla).
 * - `contentWidth`: el ancho que queda para el contenido, descontado el menú lateral.
 */
export function useBreakpoint() {
  // medidas ya descontada la escala de la web (en el celular es 1)
  const { width, height } = useEffectiveWindow();
  const isLandscape = width > height;
  const isDesktop = width >= DESKTOP_MIN_WIDTH;
  const hasSideNav = isDesktop || (isLandscape && width >= 640);
  const navWidth = hasSideNav ? (isDesktop ? SIDE_NAV_WIDTH : 88) : 0;
  return {
    width,
    height,
    isLandscape,
    isTablet: width >= TABLET_MIN_WIDTH,
    isDesktop,
    hasSideNav,
    /** Menú lateral ancho (con el texto al lado del ícono) o angosto (solo íconos con la etiqueta abajo). */
    navWidth,
    contentWidth: width - navWidth,
  };
}

/**
 * Cuántas columnas entran para tarjetas de un ancho mínimo dado, dentro del ancho del contenido.
 * Siempre al menos 1 y nunca más de `max`.
 */
export function columnsFor(contentWidth: number, minItemWidth: number, max = 4, gap = 16, padding = 48): number {
  const usable = Math.min(contentWidth, WIDE_MAX_WIDTH) - padding;
  return Math.max(1, Math.min(max, Math.floor((usable + gap) / (minItemWidth + gap))));
}

/**
 * Rellena la última fila de una grilla con huecos (`null`) para que las tarjetas de la última fila
 * no se estiren a todo el ancho cuando sobran columnas.
 */
export function padForGrid<T>(items: T[], columns: number): (T | null)[] {
  if (columns <= 1) return items;
  const missing = (columns - (items.length % columns)) % columns;
  return [...items, ...Array.from({ length: missing }, () => null)];
}