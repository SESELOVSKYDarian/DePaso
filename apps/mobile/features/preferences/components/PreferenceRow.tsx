import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { makeStyles } from "@/lib/theme";

interface PreferenceRowProps {
  title: string;
  meta: string;
  removeLabel: string;
  onRemove: () => void;
}

/** Una preferencia guardada, con su botón para quitarla. */
export function PreferenceRow({ title, meta, removeLabel, onRemove }: PreferenceRowProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <AnimatedPressable accessibilityLabel={removeLabel} haptic={false} onPress={onRemove} style={styles.remove}>
        <Text style={styles.removeLabel}>✕</Text>
      </AnimatedPressable>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface.primary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing.sm, minHeight: 56 },
    text: { flex: 1, gap: 2 },
    title: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 15, color: colors.text.primary },
    meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
    remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    removeLabel: { fontSize: 16, color: colors.text.secondary },
  }),
);