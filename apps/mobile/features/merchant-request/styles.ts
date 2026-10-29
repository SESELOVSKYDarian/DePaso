import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

export const useStyles = makeStyles((colors) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.surface.base, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface.base },
  flex: { flex: 1 },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
  },
  tabSelected: { borderColor: colors.brand.navy, backgroundColor: colors.brand.navy },
  tabLabel: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.primary },
  tabLabelSelected: { color: colors.text.onNavy, fontWeight: "600" },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
  },
  branchRowSelected: { borderColor: colors.text.primary, borderWidth: 2 },
  branchName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
  branchMeta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
  intro: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
  statusCard: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
  statusBody: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
}));
