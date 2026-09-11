import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@depaso/design-tokens";

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Estado vacío agradable (sección 28) — nunca una lista en blanco sin explicación. */
export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 18,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.xxs,
  },
  description: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
});
