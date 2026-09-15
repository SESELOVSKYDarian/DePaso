import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Bienvenida (depaso-bienvenida en Figma). El documento de producto pide un onboarding
 * breve, no de varias pantallas (sección 29 / docs/brand-product/UX-UI.md) — el Figma sólo
 * diseñó esta única pantalla, así que no se inventan slides adicionales.
 */
export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();

  const goTo = async (path: "/(auth)/register" | "/(auth)/login") => {
    await completeOnboarding();
    router.replace(path);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/logo-wordmark.png")}
          style={styles.wordmark}
          resizeMode="contain"
        />
        <Image
          source={require("../assets/images/bienvenida.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
        <Text style={styles.title}>Tu compra,{"\n"}en el camino.</Text>
        <Text style={styles.subtitle}>
          Encontrá los mejores precios en los comercios que te quedan de paso.
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <AnimatedPressable
          accessibilityLabel="Comenzar"
          onPress={() => void goTo("/(auth)/register")}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryLabel}>Comenzar</Text>
        </AnimatedPressable>

        <Text style={styles.loginRow}>
          Ya tengo una cuenta.{" "}
          <Text style={styles.loginLink} onPress={() => void goTo("/(auth)/login")}>
            Iniciar sesión
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    width: 160,
    height: 54,
    marginBottom: spacing.lg,
  },
  illustration: {
    width: "100%",
    height: 220,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 300,
  },
  footer: {
    alignItems: "center",
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xxs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border.strong,
  },
  dotActive: {
    backgroundColor: colors.brand.navy,
    width: 18,
  },
  primaryButton: {
    alignSelf: "stretch",
    backgroundColor: colors.brand.navy,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryLabel: {
    fontFamily: typography.buttonLabel.fontFamily,
    fontSize: 16,
    color: colors.text.onNavy,
  },
  loginRow: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  loginLink: {
    color: colors.text.secondary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
