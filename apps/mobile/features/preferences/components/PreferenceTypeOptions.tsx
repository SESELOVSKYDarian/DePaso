import type { ProductPreferenceInput } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles } from "@/lib/theme";

type PreferenceType = ProductPreferenceInput["type"];

const OPTIONS: { value: PreferenceType; label: string; hint: string }[] = [
  { value: "EXACT", label: "Marca exacta", hint: "Nunca la reemplaces por otra." },
  { value: "PREFERRED", label: "Marca preferida", hint: "Priorizala, pero puede cambiar si conviene mucho." },
  { value: "ANY", label: "Cualquier marca", hint: "Sin restricción: elegí siempre la más conveniente." },
];

interface PreferenceTypeOptionsProps {
  value: PreferenceType;
  onChange: (value: PreferenceType) => void;
}

/** Qué tan estricta es la preferencia de marca: exacta, preferida o cualquiera. */
export function PreferenceTypeOptions({ value, onChange }: PreferenceTypeOptionsProps) {
  const styles = useStyles();
  return (
    <View style={styles.options}>
      {OPTIONS.map((option) => (
        <AnimatedPressable
          key={option.value}
          accessibilityLabel={option.label}
          haptic={false}
          onPress={() => onChange(option.value)}
          style={[styles.option, value === option.value ? styles.optionSelected : null]}
        >
          <Text style={[styles.optionLabel, value === option.value ? styles.optionLabelSelected : null]}>{option.label}</Text>
          <Text style={styles.optionHint}>{option.hint}</Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    options: { gap: spacing.sm },
    option: { borderRadius: radii.md, borderWidth: 1, borderColor: colors.border.subtle, backgroundColor: colors.surface.primary, padding: spacing.sm, minHeight: 56 },
    optionSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.mint },
    optionLabel: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 14, color: colors.text.primary },
    optionLabelSelected: { color: colors.brand.navy },
    optionHint: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  }),
);