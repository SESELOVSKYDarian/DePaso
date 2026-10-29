import { useEffect, type ReactNode } from "react";
import { Platform, View } from "react-native";
import { installWebStyles } from "@/lib/web/installWebStyles";
import { CONTENT_MAX_WIDTH, useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { useColors } from "@/lib/theme";

/**
 * Fondo de toda la app con el color del tema. Sin esto, durante la animación de volver atrás
 * se veía el fondo blanco de la ventana entre una pantalla y otra.
 */
export function ThemedRoot({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { isTablet } = useBreakpoint();
  // en la web: barras de desplazamiento finas y el fondo de toda la página con el color del tema
  useEffect(() => {
    installWebStyles();
    if (Platform.OS === "web" && typeof document !== "undefined") document.body.style.backgroundColor = colors.surface.base;
  }, [colors.surface.base]);
  // En pantallas grandes (tablet, escritorio, web) el contenido se centra con un ancho máximo
  // y los costados quedan con el fondo del tema; en el celu ocupa todo el ancho.
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.base, alignItems: "center" }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: isTablet ? CONTENT_MAX_WIDTH : undefined,
          // en pantallas grandes, una línea fina marca los bordes de la "pantalla" del celular
          ...(isTablet ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.subtle } : null),
        }}
      >
        {children}
      </View>
    </View>
  );
}
