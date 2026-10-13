import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { elevation, radii, spacing } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  const styles = useStyles();
  return <View style={[styles.base, elevated ? elevation.level2 : elevation.level1, style]}>{children}</View>;
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  base: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
  },
}));
