import type { ReactNode } from "react";
import { View } from "react-native";
import { READING_MAX_WIDTH, useBreakpoint, WIDE_MAX_WIDTH } from "@/lib/responsive/useBreakpoint";

/**
 * Marco de una pantalla completa (título, filtros y lista juntos): en pantallas grandes lo centra
 * con un ancho máximo para que el título quede alineado con el contenido. En el celular no hace nada.
 */
export function ScreenFrame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { isTablet } = useBreakpoint();
  if (!isTablet) return <>{children}</>;
  return <View style={{ flex: 1, width: "100%", maxWidth: wide ? WIDE_MAX_WIDTH : READING_MAX_WIDTH, alignSelf: "center" }}>{children}</View>;
}
