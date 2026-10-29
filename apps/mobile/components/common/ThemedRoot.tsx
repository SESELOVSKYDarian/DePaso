import type { ReactNode } from "react";
import { View } from "react-native";
import { CONTENT_MAX_WIDTH, useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { useColors } from "@/lib/theme";

/**
 * Fondo de toda la app con el color del tema. Sin esto, durante la animación de volver atrás
 * se veía el fondo blanco de la ventana entre una pantalla y otra.
 */
export function ThemedRoot({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { isTablet } = useBreakpoint();
  // En pantallas grandes (tablet, escritorio, web) el contenido se centra con un ancho máximo
  // y los costados quedan con el fondo del tema; en el celu ocupa todo el ancho.
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.base, alignItems: "center" }}>
      <View style={{ flex: 1, width: "100%", maxWidth: isTablet ? CONTENT_MAX_WIDTH : undefined }}>{children}</View>
    </View>
  );
}
