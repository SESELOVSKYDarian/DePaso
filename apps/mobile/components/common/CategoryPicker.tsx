import { PRODUCT_TYPE_GROUPS } from "@depaso/domain";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { AnimatedPressable } from "./AnimatedPressable";

interface CategoryPickerProps {
  label?: string;
  /** Nombre de la categoría elegida ("" si todavía no eligió ninguna). */
  value: string;
  onChange: (category: string) => void;
  error?: string | undefined;
}

/** Selector de categorías del catálogo: se elige tocando, sin escribir. */
export function CategoryPicker({ label = "Categoría", value, onChange, error }: CategoryPickerProps) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {PRODUCT_TYPE_GROUPS.map((group) => {
          const selected = value === group.label;
          return (
            <AnimatedPressable
              key={group.id}
              accessibilityLabel={group.label}
              haptic={false}
              onPress={() => onChange(group.label)}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{group.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: spacing.xs },
    label: { fontFamily: typography.caption.fontFamily, fontSize: 13, fontWeight: "600", color: colors.text.secondary },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    chip: {
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    chipSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
    chipText: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
    chipTextSelected: { color: colors.brand.navy },
    error: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.state.errorStrong },
  }),
);
