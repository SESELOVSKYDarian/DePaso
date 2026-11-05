import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles, useColors } from "@/lib/theme";

interface QuantityStepperProps {
  /** Cuántas unidades se compraron. */
  value: number;
  /** Cuántas se pidieron en la lista. */
  max: number;
  productName: string;
  onChange: (value: number) => void;
}

/** "Compré − 2 + de 3": para anotar cuántas unidades se llevan realmente, sin tocar la lista. */
export function QuantityStepper({ value, max, productName, onChange }: QuantityStepperProps) {
  const styles = useStyles();
  const colors = useColors();
  const button = (icon: "remove" | "add", enabled: boolean, next: number, label: string) => (
    <AnimatedPressable
      accessibilityLabel={`${label} ${productName}`}
      haptic={false}
      onPress={enabled ? () => onChange(next) : undefined}
      style={[styles.button, enabled ? null : styles.disabled]}
    >
      <Ionicons name={icon} size={18} color={colors.text.primary} />
    </AnimatedPressable>
  );
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Compré</Text>
      {button("remove", value > 0, value - 1, "Menos unidades de")}
      <Text style={styles.value} accessibilityLabel={`${value} de ${max}`}>
        {value}
      </Text>
      {button("add", value < max, value + 1, "Más unidades de")}
      <Text style={styles.label}>de {max}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    label: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    value: { minWidth: 24, textAlign: "center", fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    button: { width: 44, height: 44, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.input, borderWidth: 1, borderColor: colors.border.subtle },
    disabled: { opacity: 0.35 },
  }),
);