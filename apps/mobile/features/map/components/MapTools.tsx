import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@depaso/design-tokens";
import { LocateButton } from "@/components/map/LocateButton";
import type { MapPoint } from "@/lib/map/mapCommands";

/** Pone el botón "dónde estoy" encima de un mapa, abajo a la izquierda. */
export function MapTools({ children, onLocated }: { children: ReactNode; onLocated: (point: MapPoint) => void }) {
  return (
    <View>
      {children}
      <LocateButton onLocated={onLocated} style={styles.locate} />
    </View>
  );
}

const styles = StyleSheet.create({
  locate: { position: "absolute", left: spacing.md, bottom: spacing.md },
});
