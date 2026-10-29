import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles } from "@/lib/theme";
import type { ActivityTab } from "../useActivityFeed";

const OPTIONS: { id: ActivityTab; label: string }[] = [
  { id: "news", label: "Novedades" },
  { id: "mine", label: "Para vos" },
];

/** Selector de dos opciones: lo que publica el equipo o los avisos propios. */
export function ActivityTabs({ tab, onChange }: { tab: ActivityTab; onChange: (tab: ActivityTab) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.tabs}>
      {OPTIONS.map((option) => (
        <AnimatedPressable
          key={option.id}
          accessibilityLabel={option.label}
          haptic={false}
          onPress={() => onChange(option.id)}
          style={[styles.button, tab === option.id ? styles.buttonActive : null]}
        >
          <Text style={[styles.label, tab === option.id ? styles.labelActive : null]}>{option.label}</Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    tabs: {
      flexDirection: "row",
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
      backgroundColor: colors.surface.input,
      borderRadius: radii.full,
      padding: 3,
    },
    button: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.full },
    buttonActive: { backgroundColor: colors.brand.navy },
    label: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary },
    labelActive: { color: colors.text.onNavy, fontWeight: "600" },
  }),
);
