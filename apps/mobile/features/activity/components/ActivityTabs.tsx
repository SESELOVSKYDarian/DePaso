import type { CommunityFeedScope } from "@depaso/validation";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles } from "@/lib/theme";

const OPTIONS: { id: CommunityFeedScope; label: string }[] = [
  { id: "community", label: "Comunidad" },
  { id: "mine", label: "Mis reportes" },
];

/** Selector de dos opciones: reportes de todos o solo los míos. */
export function ActivityTabs({ tab, onChange }: { tab: CommunityFeedScope; onChange: (tab: CommunityFeedScope) => void }) {
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
