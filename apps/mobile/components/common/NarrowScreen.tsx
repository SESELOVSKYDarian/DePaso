import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { makeStyles } from "@/lib/theme";
import { BrandPanel } from "./BrandPanel";

/** Ancho de la columna del formulario. */
const FORM_WIDTH = 520;

/**
 * Pantallas de una sola tarea (ingresar, registrarse, el código del mail, la bienvenida, los
 * primeros pasos). Según el espacio:
 * - computadora: dos mitades, la marca a la izquierda y el formulario a la derecha;
 * - tablet: una columna centrada, como una tarjeta;
 * - celular: ocupa todo.
 */
export function NarrowScreen({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { isTablet, hasBrandPanel } = useBreakpoint();
  if (!isTablet) return <>{children}</>;

  if (hasBrandPanel) {
    return (
      <View style={styles.split}>
        <BrandPanel />
        <View style={styles.formSide}>
          <View style={styles.formColumn}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    split: { flex: 1, flexDirection: "row", backgroundColor: colors.surface.base },
    formSide: { flex: 1, alignItems: "center", backgroundColor: colors.surface.base },
    formColumn: { flex: 1, width: "100%", maxWidth: FORM_WIDTH },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.secondary },
    card: {
      flex: 1,
      width: "100%",
      maxWidth: FORM_WIDTH,
      backgroundColor: colors.surface.base,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border.subtle,
    },
  }),
);