import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { HOW_TO_STEPS } from "./steps";

/** Los cinco pasos para usar DePaso, en una tarjeta compacta. La usan "Cómo usar" y el cierre del registro. */
export function HowToSteps() {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.card}>
      {HOW_TO_STEPS.map((step, index) => (
        <View key={step.title} style={[styles.step, index > 0 ? styles.separated : null]}>
          <View style={styles.badge}>
            <Ionicons name={step.icon} size={17} color={colors.brand.navy} />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>
              {index + 1}. {step.title}
            </Text>
            <Text style={styles.text}>{step.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface.primary, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.subtle, overflow: "hidden" },
    step: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: "flex-start" },
    separated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle },
    badge: { width: 32, height: 32, borderRadius: radii.full, backgroundColor: colors.tint.blue.bg, alignItems: "center", justifyContent: "center" },
    body: { flex: 1, gap: 1 },
    title: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, lineHeight: 19, color: colors.text.primary },
    text: { fontFamily: typography.subtitle.fontFamily, fontSize: 13, lineHeight: 18, color: colors.text.secondary },
  }),
);
