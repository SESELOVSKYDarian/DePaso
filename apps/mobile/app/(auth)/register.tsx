import { MIN_AGE_YEARS } from "@depaso/domain";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles } from "@/lib/theme";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox } from "@/components/Checkbox";
import { ProgressHeader } from "@/components/ProgressHeader";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { SocialButton } from "@/components/SocialButton";

/** Selector de método de registro (depaso-crea-cuenta en Figma). El formulario con email vive
 * en `register-email.tsx`. Para Google/Meta/Discord el consentimiento legal (18+, términos y
 * privacidad) se marca acá, igual que en el formulario: sin él no se arma la cuenta. */
export default function CreateAccountScreen() {
  const styles = useStyles();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const consent =
    ageConfirmed && acceptTerms && acceptPrivacy
      ? ({
          ageConfirmed18Plus: true,
          acceptTerms: true,
          acceptPrivacyNotice: true,
          marketingOptIn,
        } as const)
      : null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.2} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Creá tu cuenta</Text>
        <Text style={styles.subtitle}>Elegí cómo querés empezar</Text>

        <View style={styles.checkboxCard}>
          <Checkbox
            checked={ageConfirmed}
            onToggle={setAgeConfirmed}
            accessibilityLabel="Declaro ser mayor de edad"
            error={showErrors && !ageConfirmed ? "Tenés que declarar que sos mayor de edad." : undefined}
          >
            <Text style={styles.checkboxLabel}>Declaro tener {MIN_AGE_YEARS} años o más.</Text>
          </Checkbox>
          <Checkbox
            checked={acceptTerms}
            onToggle={setAcceptTerms}
            accessibilityLabel="Acepto los Términos y Condiciones"
            error={showErrors && !acceptTerms ? "Tenés que aceptar los Términos y Condiciones." : undefined}
          >
            <Text style={styles.checkboxLabel}>
              Acepto los{" "}
              <Link href="/legal/terms" style={styles.inlineLink}>
                Términos y Condiciones
              </Link>{" "}
              de DePaso.
            </Text>
          </Checkbox>
          <Checkbox
            checked={acceptPrivacy}
            onToggle={setAcceptPrivacy}
            accessibilityLabel="Leí la Política de Privacidad"
            error={showErrors && !acceptPrivacy ? "Tenés que leer la Política de Privacidad." : undefined}
          >
            <Text style={styles.checkboxLabel}>
              Conocé cómo tratamos tus datos en la{" "}
              <Link href="/legal/privacy" style={styles.inlineLink}>
                Política de Privacidad
              </Link>
              .
            </Text>
          </Checkbox>
          <Checkbox
            checked={marketingOptIn}
            onToggle={setMarketingOptIn}
            accessibilityLabel="Quiero recibir novedades y promociones"
          >
            <Text style={styles.checkboxLabel}>Quiero recibir novedades y promociones.</Text>
          </Checkbox>
        </View>

        <SocialAuthButtons mode="register" consent={consent} onConsentMissing={() => setShowErrors(true)} />

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
