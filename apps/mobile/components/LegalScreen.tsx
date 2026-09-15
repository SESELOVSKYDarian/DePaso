import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@depaso/design-tokens";

export function LegalScreen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function LegalBullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export function LegalNotice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  paragraph: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  bulletRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  bulletDot: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  bulletText: {
    flex: 1,
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  notice: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface.secondary,
  },
  noticeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
  },
});
