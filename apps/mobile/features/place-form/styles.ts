import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";

export const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    padding: spacing.lg,
  },
  label: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.primary,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
  },
  typeChipSelected: {
    backgroundColor: colors.brand.mint,
    borderColor: colors.brand.navy,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  typeLabelSelected: {
    color: colors.text.primary,
    fontWeight: "600",
  },
  searchBox: { zIndex: 2 },
  locationButton: {
    alignSelf: "flex-start",
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    minHeight: 44,
    justifyContent: "center",
  },
  locationLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    textDecorationLine: "underline",
  },
  favoriteRow: {
    marginBottom: spacing.lg,
  },
  checkboxLabel: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  submitLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.onNavy,
  },
  deleteButton: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.state.error,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  deleteLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.state.error,
  },
}));
