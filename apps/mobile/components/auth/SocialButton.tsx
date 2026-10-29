import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "../common/AnimatedPressable";

export type SocialProvider = "google" | "facebook" | "discord" | "email";

interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const PROVIDER_META: Record<SocialProvider, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  google: { label: "Continuar con Google", icon: "logo-google" },
  // Meta inicia sesión con la API de Facebook Login; el ícono disponible es el de Facebook.
  facebook: { label: "Continuar con Meta", icon: "logo-facebook" },
  discord: { label: "Continuar con Discord", icon: "logo-discord" },
  email: { label: "Continuar con Email", icon: "mail-outline" },
};

/**
 * Botón de ingreso/registro. Los íconos van en el color de texto del tema (no en el color de
 * cada marca) para que la fila se vea como un solo sistema, en claro y en oscuro.
 */
export function SocialButton({ provider, onPress, loading = false, disabled = false }: SocialButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const meta = PROVIDER_META[provider];

  return (
    <AnimatedPressable
      accessibilityLabel={meta.label}
      haptic={false}
      onPress={disabled || loading ? () => undefined : onPress}
      style={[styles.base, disabled ? styles.disabled : null]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text.primary} />
      ) : (
        <Ionicons name={meta.icon} size={18} color={colors.text.primary} />
      )}
      <Text style={styles.label}>{meta.label}</Text>
    </AnimatedPressable>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      minHeight: 50,
      borderRadius: radii.full,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    disabled: {
      opacity: 0.5,
    },
    label: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
  }),
);
