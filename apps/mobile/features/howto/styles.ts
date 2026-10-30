import { radii, spacing, typography } from "@depaso/design-tokens";
import { StyleSheet } from "react-native";
import { makeStyles } from "@/lib/theme";

export const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.lg },
    intro: { fontFamily: typography.subtitle.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    card: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      overflow: "hidden",
    },
    step: { flexDirection: "row", gap: spacing.md, padding: spacing.md, alignItems: "flex-start" },
    separated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle },
    badge: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.tint.blue.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    stepBody: { flex: 1, gap: 2 },
    stepTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, lineHeight: 20, color: colors.text.primary },
    stepText: { fontFamily: typography.subtitle.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary },
    download: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      minHeight: 52,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
    },
    downloadLabel: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.onNavy },
    error: { fontFamily: typography.subtitle.fontFamily, fontSize: 13, color: colors.state.errorStrong, textAlign: "center" },
  }),
);
