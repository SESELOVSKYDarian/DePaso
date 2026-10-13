import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { AnimatedPressable } from "./AnimatedPressable";

type SocialProvider = "google" | "apple" | "email";

interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
}

const PROVIDER_META: Record<SocialProvider, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  google: { label: "Continuar con Google", icon: "logo-google" },
  apple: { label: "Continuar con Apple", icon: "logo-apple" },
  email: { label: "Continuar con Email", icon: "mail-outline" },
};

/** El logo de Google conserva su azul de marca; los demás toman el color de texto del tema. */
const GOOGLE_BLUE = "#4285F4";

/**
 * Sign-in social — sección 10 del master prompt: "preparar arquitectura para Google/Apple
 * posteriormente". Sin credenciales OAuth configuradas en este entorno (Google Cloud /
 * Apple Developer) — el botón existe con el diseño pedido, pero avisa que todavía no está
 * conectado en vez de fingir un login real (`onPress` lo define quien lo usa). Las tres
 * variantes comparten el mismo estilo claro en Figma (bg Background2 + borde) — Apple no
 * lleva fondo navy acá.
 */
export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const meta = PROVIDER_META[provider];

  return (
    <AnimatedPressable accessibilityLabel={meta.label} haptic={false} onPress={onPress} style={styles.base}>
      <Ionicons name={meta.icon} size={18} color={provider === "google" ? GOOGLE_BLUE : colors.text.primary} />
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
    label: {
      fontFamily: typography.body.fontFamily,
      fontSize: 14,
      color: colors.text.primary,
    },
  }),
);
