import { ApiError } from "@depaso/api-client";
import { MIN_AGE_YEARS } from "@depaso/domain";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Checkbox } from "@/components/Checkbox";
import { ProgressHeader } from "@/components/ProgressHeader";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { getPendingRegistration, setPendingRegistration } from "@/lib/auth/pendingRegistration";
import { makeStyles } from "@/lib/theme";

type Provider = "google" | "facebook" | "discord" | "email";
const PROVIDER_LABELS: Record<Provider, string> = { google: "Google", facebook: "Meta", discord: "Discord", email: "email" };

function registerErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) return "Ya existe una cuenta con ese email.";
  if (error instanceof ApiError && error.status === 429) return "Demasiados intentos. Probá de nuevo en unos minutos.";
  return "No pudimos crear la cuenta. Revisá tu conexión e intentá de nuevo.";
}

/**
 * Último paso del registro: las declaraciones (edad, términos, privacidad) se piden una sola vez, ya
 * sabiendo con qué método se crea la cuenta (email o Google, Meta, Discord).
 */
export default function RegisterConsentScreen() {
  const styles = useStyles();
  const { provider: rawProvider } = useLocalSearchParams<{ provider?: string }>();
  const provider: Provider = rawProvider === "google" || rawProvider === "facebook" || rawProvider === "discord" ? rawProvider : "email";
  const { register } = useAuth();
  const { show: showToast } = useToast();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const consent =
    ageConfirmed && acceptTerms && acceptPrivacy
      ? ({ ageConfirmed18Plus: true, acceptTerms: true, acceptPrivacyNotice: true, marketingOptIn } as const)
      : null;

  const createWithEmail = async () => {
    const data = getPendingRegistration();
    if (!data) {
      // Se perdieron los datos (p. ej. se reabrió la app): se vuelve al formulario.
      router.replace("/(auth)/register-email");
      return;
    }
    if (!consent) {
      setShowErrors(true);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const displayName = [data.firstName.trim(), data.lastName.trim()].filter(Boolean).join(" ");
      await register({
        email: data.email,
        password: data.password,
        displayName: displayName || undefined,
        ...consent,
      });
      setPendingRegistration(null);
      router.replace("/(setup)/location");
    } catch (err) {
      setError(registerErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.8} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          Un último paso
        </Text>
        <Text style={styles.subtitle}>Confirmá estas declaraciones para crear tu cuenta con {PROVIDER_LABELS[provider]}.</Text>

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
          <Checkbox checked={marketingOptIn} onToggle={setMarketingOptIn} accessibilityLabel="Quiero recibir novedades y promociones">
            <Text style={styles.checkboxLabel}>Quiero recibir novedades y promociones.</Text>
          </Checkbox>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {provider === "email" ? (
          <AnimatedPressable
            accessibilityLabel={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            onPress={isSubmitting ? undefined : () => void createWithEmail()}
            haptic={!isSubmitting}
            style={[styles.submitButton, isSubmitting ? styles.submitButtonDisabled : null]}
          >
            <Text style={styles.submitLabel}>{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</Text>
          </AnimatedPressable>
        ) : (
          <SocialAuthButtons
            mode="register"
            only={provider}
            consent={consent}
            onConsentMissing={() => {
              setShowErrors(true);
              showToast("Marcá las declaraciones para seguir.", "info");
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    header: { paddingHorizontal: spacing.lg },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
    title: { fontFamily: typography.screenTitle.fontFamily, fontSize: 26, color: colors.text.primary, textAlign: "center" },
    subtitle: { fontFamily: typography.subtitle.fontFamily, fontSize: 14, color: colors.text.secondary, textAlign: "center", marginBottom: spacing.sm },
    checkboxCard: {
      backgroundColor: colors.surface.primary,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: spacing.md,
      gap: spacing.xs,
    },
    checkboxLabel: { fontFamily: typography.bodyRegular.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.primary },
    inlineLink: { color: colors.text.secondary, fontWeight: "600", textDecorationLine: "underline" },
    errorBanner: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.state.errorStrong, textAlign: "center" },
    submitButton: {
      minHeight: 52,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitLabel: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 16, color: colors.text.onNavy },
  }),
);
