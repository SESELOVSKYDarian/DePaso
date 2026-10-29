import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { Link, router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProgressHeader } from "@/components/common/ProgressHeader";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { SocialButton } from "@/components/auth/SocialButton";

/** Paso 1 del registro: elegir cómo crear la cuenta. Los datos (email) y las declaraciones (edad,
 * términos, privacidad) se piden después, una sola vez, en los pasos siguientes. */
export default function CreateAccountScreen() {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.25} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>Elegí cómo querés empezar</Text>

        <SocialAuthButtons
          mode="register"
          onSelect={(id) => router.push({ pathname: "/(auth)/register-consent", params: { provider: id } })}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <SocialButton provider="email" onPress={() => router.push("/(auth)/register-email")} />

        <Text style={styles.loginRow}>
          Ya tengo una cuenta.{" "}
          <Link href="/(auth)/login" style={styles.loginLink}>
            Iniciar sesión
          </Link>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  checkboxCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  checkboxLabel: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
  },
  inlineLink: {
    color: colors.text.secondary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.md,
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
    marginTop: spacing.xl,
  },
  loginLink: {
    fontFamily: typography.body.fontFamily,
    color: colors.text.primary,
    textDecorationLine: "underline",
  },
}));
