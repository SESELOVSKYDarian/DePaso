import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { Link, router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProgressHeader } from "@/components/ProgressHeader";
import { SocialButton } from "@/components/SocialButton";
import { useToast } from "@/components/Toast";

/** Selector de método de registro (depaso-crea-cuenta en Figma). El formulario real vive
 * en `register-email.tsx` — separarlo del selector matchea el flujo de Figma en vez del
 * formulario único que había antes acá. */
export default function CreateAccountScreen() {
  const { show: showToast } = useToast();

  const handleSocial = (provider: "Google" | "Apple") => {
    showToast(`Crear cuenta con ${provider} todavía no está conectado (falta configurar credenciales OAuth).`, "info");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.2} onBack={() => router.back()} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>Elegí la opción que prefieras para empezar</Text>

        <View style={styles.socialGroup}>
          <SocialButton provider="google" onPress={() => handleSocial("Google")} />
          <SocialButton provider="apple" onPress={() => handleSocial("Apple")} />
          <SocialButton
            provider="email"
            onPress={() => router.push("/(auth)/register-email")}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.loginRow}>
          Ya tengo una cuenta.{" "}
          <Link href="/(auth)/login" style={styles.loginLink}>
            Iniciar sesión
          </Link>
        </Text>

        <Image
          source={require("../../assets/images/ahorraravanzar.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: typography.screenTitle.fontFamily,
    fontSize: 24,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.xxs,
    marginBottom: spacing.xl,
  },
  socialGroup: {
    gap: spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
  },
  loginRow: {
    textAlign: "center",
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
  },
  loginLink: {
    fontFamily: typography.body.fontFamily,
    color: colors.text.primary,
    textDecorationLine: "underline",
  },
  illustration: {
    flex: 1,
    width: "100%",
    marginTop: spacing.xl,
  },
});
