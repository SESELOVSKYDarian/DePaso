import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { radii, spacing, typography, type ColorTokens } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "./AnimatedPressable";

type ButtonVariant = "primary" | "light" | "secondary" | "ghost" | "lime" | "danger";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Botón base del catálogo (sección 74). `variant="lime"` es para el único momento donde el
 * lima tiene sentido acá (confirmar/guardar algo con connotación de "conveniencia" —
 * nunca decorativo, regla de marca de BRAND.md).
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const isDisabled = disabled || loading;
  const textColor = textColors(colors)[variant];

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={isDisabled ? undefined : onPress}
      haptic={!isDisabled}
      style={[
        styles.base,
        variantStyles(colors)[variant],
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: textColor, fontFamily: LABEL_FONT[variant] }]}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const variantStyles = (colors: ColorTokens): Record<ButtonVariant, StyleProp<ViewStyle>> => ({
  primary: { backgroundColor: colors.brand.navy },
  // Píldora blanca: el botón de Inicio ("Iniciar mi recorrido").
  light: { backgroundColor: "#F5F5F7" },
  secondary: { backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.strong },
  ghost: { backgroundColor: "transparent" },
  lime: { backgroundColor: colors.saving.lime },
  danger: { backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.state.error },
});

/** Texto de cada variante. `ghost` usa `text.secondary`; `danger` usa la variante fuerte del
 * rojo para cumplir contraste de texto chico (≥ 4.5:1) en claro y en oscuro. */
const textColors = (colors: ColorTokens): Record<ButtonVariant, string> => ({
  primary: colors.text.onNavy,
  light: "#111114",
  secondary: colors.text.primary,
  ghost: colors.text.secondary,
  lime: colors.text.onLime,
  danger: colors.state.errorStrong,
});

/** Fredoka SemiBold sólo para el CTA principal (navy) — el resto de variantes usa
 * Montserrat SemiBold, igual que en Figma ("Ingresar dirección manualmente", etc). */
const LABEL_FONT: Record<ButtonVariant, string> = {
  primary: typography.buttonLabel.fontFamily,
  light: typography.buttonLabel.fontFamily,
  secondary: typography.body.fontFamily,
  ghost: typography.body.fontFamily,
  lime: typography.buttonLabel.fontFamily,
  danger: typography.body.fontFamily,
};

const useStyles = makeStyles(() =>
  StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      minHeight: 48,
      borderRadius: radii.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      fontFamily: typography.buttonLabel.fontFamily,
      fontSize: 16,
    },
  }),
);
