import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "./AnimatedPressable";

type ButtonVariant = "primary" | "secondary" | "ghost" | "lime" | "danger";

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
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={isDisabled ? undefined : onPress}
      haptic={!isDisabled}
      style={[
        styles.base,
        VARIANT_STYLES[variant],
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={TEXT_COLOR[variant]} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: TEXT_COLOR[variant], fontFamily: LABEL_FONT[variant] }]}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const VARIANT_STYLES: Record<ButtonVariant, StyleProp<ViewStyle>> = {
  primary: { backgroundColor: colors.brand.navy },
  secondary: { backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.strong },
  ghost: { backgroundColor: "transparent" },
  lime: { backgroundColor: colors.saving.lime },
  danger: { backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.state.error },
};

/** `ghost` usa `text.secondary`, no `brand.route` — el azul ruta (#6290C3, contraste ≈3.3:1
 * sobre blanco) no cumple como texto de botón (BRAND.md p.12: "no debe usarse como texto
 * chico... reservarlo para íconos, rutas, bordes o texto grande"). */
const TEXT_COLOR: Record<ButtonVariant, string> = {
  primary: colors.text.onNavy,
  secondary: colors.text.primary,
  ghost: colors.text.secondary,
  lime: colors.text.onLime,
  danger: colors.state.error,
};

/** Fredoka SemiBold sólo para el CTA principal (navy) — el resto de variantes usa
 * Montserrat SemiBold, igual que en Figma ("Ingresar dirección manualmente", etc). */
const LABEL_FONT: Record<ButtonVariant, string> = {
  primary: typography.buttonLabel.fontFamily,
  secondary: typography.body.fontFamily,
  ghost: typography.body.fontFamily,
  lime: typography.buttonLabel.fontFamily,
  danger: typography.body.fontFamily,
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 44,
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
});
