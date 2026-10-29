import { ScrollView, StyleSheet, Text } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { AnimatedPressable } from "./AnimatedPressable";

interface FilterChipsProps<T extends string> {
  options: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}

/** Fila de chips para filtrar (Todas / Mías / Compartidas). El elegido va en azul cielo. */
export function FilterChips<T extends string>({ options, selected, onSelect }: FilterChipsProps<T>) {
  const styles = useStyles();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <AnimatedPressable
            key={option.id}
            accessibilityLabel={`Filtrar: ${option.label}${active ? " (elegido)" : ""}`}
            haptic={false}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, active ? styles.chipActive : null]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.xs },
    chip: {
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    chipActive: { backgroundColor: colors.brand.navy, borderColor: colors.brand.navy },
    label: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    labelActive: { color: colors.text.onNavy, fontFamily: typography.itemTitle.fontFamily },
  }),
);
