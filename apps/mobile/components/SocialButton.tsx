import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "./AnimatedPressable";

type SocialProvider = "google" | "apple";

interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
}

const PROVIDER_META: Record<SocialProvider, { label: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
  google: { label: "Continuar con Google", icon: "logo-google", iconColor: "#4285F4" },
  apple: { label: "Continuar con Apple", icon: "logo-apple", iconColor: "#FFFFFF" },
};

/**
 * Sign-in social — sección 10 del master prompt: "preparar arquitectura para Google/Apple
 * posteriormente". Sin credenciales OAuth configuradas en este entorno (Google Cloud /
 * Apple Developer) — el botón existe con el diseño pedido, pero avisa que todavía no está
 * conectado en vez de fingir un login real (`onPress` lo define quien lo usa).
 */
export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const meta = PROVIDER_META[provider];
  const isApple = provider === "apple";

  return (
    <AnimatedPressable
      accessibilityLabel={meta.label}
      haptic={false}
      onPress={onPress}
      style={[styles.base, isApple ? styles.apple : styles.google]}
    >
      <Ionicons name={meta.icon} size={18} color={meta.iconColor} />
      <Text style={[styles.label, isApple ? styles.labelOnDark : styles.labelOnLight]}>{meta.label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 50,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
  },
  google: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  apple: {
    backgroundColor: colors.brand.navy,
  },
  label: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
  },
  labelOnLight: {
    color: colors.text.primary,
  },
  labelOnDark: {
    color: colors.text.onNavy,
  },
});
