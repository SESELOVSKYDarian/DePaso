import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { radii, spacing } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";

interface StripArrowsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

/** Las dos flechas redondas para recorrer una tira de productos con el mouse. */
export function StripArrows({ canGoBack, canGoForward, onBack, onForward }: StripArrowsProps) {
  const styles = useStyles();
  const colors = useColors();
  const arrow = (direction: "back" | "forward", enabled: boolean, onPress: () => void) => (
    <AnimatedPressable
      accessibilityLabel={direction === "back" ? "Ver los anteriores" : "Ver más"}
      haptic={false}
      onPress={enabled ? onPress : undefined}
      style={[styles.button, enabled ? null : styles.disabled]}
    >
      <Ionicons name={direction === "back" ? "chevron-back" : "chevron-forward"} size={20} color={colors.text.primary} />
    </AnimatedPressable>
  );
  return (
    <View style={styles.row}>
      {arrow("back", canGoBack, onBack)}
      {arrow("forward", canGoForward, onForward)}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", gap: spacing.xs },
    button: { width: 40, height: 40, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle },
    disabled: { opacity: 0.35 },
  }),
);