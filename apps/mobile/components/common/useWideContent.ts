import { useCallback, useState } from "react";
import { StyleSheet, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { READING_MAX_WIDTH, useBreakpoint, WIDE_MAX_WIDTH } from "@/lib/responsive/useBreakpoint";

/**
 * Contenido centrado y con un ancho máximo en pantallas grandes, para que ni los formularios se
 * estiren de lado a lado ni las líneas de texto se vuelvan larguísimas. Se logra con relleno a los
 * costados calculado sobre el ancho real de la pantalla (centrar con `alignSelf` dentro de un
 * scroll falla en la web). Devuelve el estilo del contenido y el `onLayout` para medir.
 */
export function useWideContent(wide: boolean | undefined, contentContainerStyle: StyleProp<ViewStyle>) {
  const [width, setWidth] = useState(0);
  const { isTablet } = useBreakpoint();
  const onLayout = useCallback((event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width), []);
  if (!isTablet || width === 0) return { style: contentContainerStyle, onLayout };
  const flat = StyleSheet.flatten(contentContainerStyle) ?? {};
  const base = typeof flat.paddingHorizontal === "number" ? flat.paddingHorizontal : 0;
  const extra = Math.max(0, (width - (wide ? WIDE_MAX_WIDTH : READING_MAX_WIDTH)) / 2);
  return { style: [contentContainerStyle, { paddingHorizontal: base + extra }], onLayout };
}