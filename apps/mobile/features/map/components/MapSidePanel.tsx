import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { spacing } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";

/** Ancho del panel de comercios cuando el mapa comparte la pantalla con él. */
export const MAP_SIDE_PANEL_WIDTH = 420;

interface MapSidePanelProps {
  /** Título y "Ver todos", arriba del panel. */
  header: ReactNode;
  /** Espacio para el borde superior de la pantalla (barra de estado, muesca). */
  topInset: number;
  children: ReactNode;
}

/** Panel a la izquierda del mapa en pantallas anchas: reemplaza a la hoja deslizable del celular. */
export function MapSidePanel({ header, topInset, children }: MapSidePanelProps) {
  const styles = useStyles();
  return (
    <View style={[styles.panel, { paddingTop: topInset + spacing.md }]}>
      {header}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    panel: { width: MAP_SIDE_PANEL_WIDTH, backgroundColor: colors.surface.base, borderRightWidth: 1, borderRightColor: colors.border.subtle },
    content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  }),
);