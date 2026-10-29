import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles } from "@/lib/theme";
import type { FormMode } from "../useMerchantPriceForm";

const OPTIONS: { value: FormMode; label: string }[] = [
  { value: "catalog", label: "Buscar en el catálogo" },
  { value: "new", label: "Producto nuevo" },
];

/** Dos pestañas: publicar algo que ya está en el catálogo o crear un producto nuevo. */
export function ModeTabs({ mode, onChange }: { mode: FormMode; onChange: (mode: FormMode) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.tabs}>
      {OPTIONS.map(({ value, label }) => (
        <AnimatedPressable
          key={value}
          accessibilityLabel={label}
          haptic={false}
          onPress={() => onChange(value)}
          style={[styles.tab, mode === value ? styles.tabSelected : null]}
        >
          <Text style={[styles.label, mode === value ? styles.labelSelected : null]}>{label}</Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    tabs: { flexDirection: "row", gap: spacing.sm },
    tab: {
      flex: 1,
      alignItems: "center",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
      paddingVertical: spacing.sm,
    },
    tabSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
    label: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    labelSelected: { color: colors.text.primary, fontWeight: "600" },
  }),
);
