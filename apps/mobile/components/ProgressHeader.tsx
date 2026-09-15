import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@depaso/design-tokens";
import { AnimatedPressable } from "./AnimatedPressable";

interface ProgressHeaderProps {
  /** Fracción completada (0-1) de la barra fina debajo del back button. */
  progress: number;
  onBack?: () => void;
}

/** Cabecera de los pasos de registro/setup (crea-cuenta → listo en Figma): flecha atrás +
 * barra de progreso fina en lima. `onBack` ausente oculta la flecha (primer paso). */
export function ProgressHeader({ progress, onBack }: ProgressHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack ? (
        <AnimatedPressable accessibilityLabel="Volver" haptic={false} onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
        </AnimatedPressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing.xs,
    marginBottom: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border.subtle,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.brand.accent,
  },
});
