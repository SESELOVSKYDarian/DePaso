import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { INTERMEDIATE_RANGE, STRICT_RANGE, useDetour } from "@/lib/detour/DetourContext";
import { AnimatedPressable } from "./AnimatedPressable";

function Stepper({
  title,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  title: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={styles.stepper}>
        <AnimatedPressable
          accessibilityLabel={`Menos cuadras en ${title}`}
          haptic={false}
          onPress={() => onChange(Math.max(min, value - step))}
          style={[styles.button, value <= min ? styles.disabled : null]}
        >
          <Ionicons name="remove" size={20} color={colors.text.primary} />
        </AnimatedPressable>
        <View style={styles.valueBox}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>{value === 1 ? "cuadra" : "cuadras"}</Text>
        </View>
        <AnimatedPressable
          accessibilityLabel={`Más cuadras en ${title}`}
          haptic={false}
          onPress={() => onChange(Math.min(max, value + step))}
          style={[styles.button, value >= max ? styles.disabled : null]}
        >
          <Ionicons name="add" size={20} color={colors.text.primary} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

/**
 * Cuánto te querés desviar en cada nivel de compra. Se usa al crear la cuenta y en Perfil. El
 * nivel "Hipereconómico" no tiene tope: es lo más barato sin importar tu ruta.
 */
export function DetourPicker() {
  const { strictBlocks, intermediateBlocks, setBlocks } = useDetour();
  return (
    <View style={{ gap: spacing.sm }}>
      <Stepper
        title="Sin desvíos"
        hint="Comercios casi sobre tu camino."
        value={strictBlocks}
        min={STRICT_RANGE.min}
        max={STRICT_RANGE.max}
        step={1}
        onChange={(strict) => setBlocks({ strict, intermediate: intermediateBlocks })}
      />
      <Stepper
        title="Intermedio"
        hint="Un desvío razonable si ahorrás más."
        value={intermediateBlocks}
        min={INTERMEDIATE_RANGE.min}
        max={INTERMEDIATE_RANGE.max}
        step={1}
        onChange={(intermediate) => setBlocks({ strict: strictBlocks, intermediate })}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    text: { flex: 1, gap: 2 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    hint: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.text.secondary },
    stepper: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    button: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.surface.input,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: { opacity: 0.35 },
    valueBox: { minWidth: 62, alignItems: "center" },
    value: { fontFamily: typography.heroTitle.fontFamily, fontSize: 22, color: colors.text.primary },
    unit: { fontFamily: typography.caption.fontFamily, fontSize: 11, color: colors.text.secondary },
  }),
);
