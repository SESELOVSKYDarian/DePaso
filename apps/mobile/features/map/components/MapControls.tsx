import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { radii, spacing } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { LocateButton } from "@/components/map/LocateButton";
import type { MapPoint } from "@/lib/map/mapCommands";
import { makeStyles, useColors } from "@/lib/theme";

interface MapControlsProps {
  onLocated: (point: MapPoint) => void;
  satellite: boolean;
  onToggleSatellite: () => void;
  /** Sin recorrido no hay nada que editar: el botón no se muestra. */
  onEditRoute?: () => void;
}

/** Botones redondos que flotan sobre el mapa: dónde estoy, tipo de mapa y editar el recorrido. */
export function MapControls({ onLocated, satellite, onToggleSatellite, onEditRoute }: MapControlsProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.column}>
      <LocateButton onLocated={onLocated} />
      <AnimatedPressable
        accessibilityLabel={satellite ? "Volver al mapa común" : "Ver el mapa en satélite"}
        haptic={false}
        onPress={onToggleSatellite}
        style={[styles.button, satellite ? styles.buttonActive : null]}
      >
        <Ionicons name="layers-outline" size={22} color={colors.text.primary} />
      </AnimatedPressable>
      {onEditRoute ? (
        <AnimatedPressable accessibilityLabel="Editar recorrido" haptic={false} onPress={onEditRoute} style={styles.button}>
          <Ionicons name="create-outline" size={22} color={colors.text.primary} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    column: { gap: spacing.sm },
    button: {
      width: 48,
      height: 48,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    buttonActive: { borderColor: colors.brand.route },
  }),
);
