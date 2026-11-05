import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { makeStyles } from "@/lib/theme";

/** Ancho de las pantallas de una sola tarea (ingresar, registrarse, confirmar el mail…). */
const NARROW_WIDTH = 520;

/**
 * Pantallas de una sola tarea (ingresar, registrarse, el código del mail, la bienvenida). En una
 * pantalla grande se muestran en una columna centrada, como una tarjeta; en el celular ocupan todo.
 */
export function NarrowScreen({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { isTablet } = useBreakpoint();
  if (!isTablet) return <>{children}</>;
  return (
    <View style={styles.outer}>
      <View style={styles.column}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    outer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.secondary },
    column: {
      flex: 1,
      width: "100%",
      maxWidth: NARROW_WIDTH,
      backgroundColor: colors.surface.base,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border.subtle,
    },
  }),
);
