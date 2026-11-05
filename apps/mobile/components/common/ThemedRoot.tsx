import { useEffect, type ReactNode } from "react";
import { Platform, View } from "react-native";
import { installWebStyles } from "@/lib/web/installWebStyles";
import { installWebScale } from "@/lib/web/webScale";
import { useColors } from "@/lib/theme";

/**
 * Fondo de toda la app con el color del tema. Sin esto, durante la animación de volver atrás
 * se veía el fondo blanco de la ventana entre una pantalla y otra. La app ocupa toda la
 * pantalla: cada pantalla se acomoda sola al ancho que tiene (ver `useBreakpoint`).
 */
export function ThemedRoot({ children }: { children: ReactNode }) {
  const colors = useColors();
  // en la web: barras de desplazamiento finas y el fondo de toda la página con el color del tema
  useEffect(() => {
    installWebStyles();
    if (Platform.OS === "web" && typeof document !== "undefined") document.body.style.backgroundColor = colors.surface.base;
  }, [colors.surface.base]);
  // en la web, la interfaz se agranda según el ancho de la pantalla
  useEffect(() => installWebScale(), []);
  return <View style={{ flex: 1, backgroundColor: colors.surface.base }}>{children}</View>;
}
