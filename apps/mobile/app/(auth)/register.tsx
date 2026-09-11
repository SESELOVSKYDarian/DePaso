import { ApiError } from "@depaso/api-client";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { MIN_AGE_YEARS, PASSWORD_MIN_LENGTH } from "@depaso/domain";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthHero } from "@/components/AuthHero";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { PillInput } from "@/components/PillInput";
import { SocialButton } from "@/components/SocialButton";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth/AuthContext";

function registerErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return "Ya existe una cuenta con ese email.";
  }
  if (error instanceof ApiError && error.status === 429) {
    return "Demasiados intentos. Probá de nuevo en unos minutos.";
  }
  return "No pudimos crear la cuenta. Revisá tu conexión e intentá de nuevo.";
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const { show: showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nextFieldErrors: Record<string, string> = {};
    if (!email) nextFieldErrors.email = "Ingresá tu email.";
    if (password.length < PASSWORD_MIN_LENGTH) {
      nextFieldErrors.password = `La contraseña necesita al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }
    if (!ageConfirmed) nextFieldErrors.age = "Tenés que declarar que sos mayor de edad.";
    if (!acceptTerms) nextFieldErrors.terms = "Tenés que aceptar los Términos y Condiciones.";
    if (!acceptPrivacy) nextFieldErrors.privacy = "Tenés que leer la Política de Privacidad.";

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        email,
        password,
        ageConfirmed18Plus: true,
        acceptTerms: true,
        acceptPrivacyNotice: true,
        marketingOptIn,
      });
    } catch (err) {
      setError(registerErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocial = (provider: "Google" | "Apple") => {
    showToast(`Crear cuenta con ${provider} todavía no está conectado (falta configurar credenciales OAuth).`, "info");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHero title="Creá tu cuenta" subtitle="Te toma un minuto." />

          <View style={styles.socialGroup}>
            <SocialButton provider="google" onPress={() => handleSocial("Google")} />
            <SocialButton provider="apple" onPress={() => handleSocial("Apple")} />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>o con tu email</Text>
            <View style={styles.dividerLine} />
          </View>

          <PillInput
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="Email"
            error={fieldErrors.email}
          />
          <PillInput
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            isPassword
            autoComplete="password-new"
            placeholder="Contraseña"
            error={fieldErrors.password}
          />

          <View style={styles.checkboxCard}>
            <Checkbox
              checked={ageConfirmed}
              onToggle={setAgeConfirmed}
              accessibilityLabel="Declaro ser mayor de edad"
              error={fieldErrors.age}
            >
              <Text style={styles.checkboxLabel}>Declaro tener {MIN_AGE_YEARS} años o más.</Text>
            </Checkbox>

            <Checkbox
              checked={acceptTerms}
              onToggle={setAcceptTerms}
              accessibilityLabel="Acepto los Términos y Condiciones"
              error={fieldErrors.terms}
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
              error={fieldErrors.privacy}
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

          <Button
            label={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
            style={styles.pillButton}
          />

          <Link href="/(auth)/login" style={styles.link}>
            ¿Ya tenés cuenta? Iniciá sesión
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: "center",
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
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.text.muted,
  },
  checkboxCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  checkboxLabel: {
    fontFamily: typography.bodyRegular.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.primary,
  },
  inlineLink: {
    color: colors.brand.route,
    fontWeight: "600",
  },
  errorBanner: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.state.error,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  pillButton: {
    borderRadius: radii.full,
  },
  link: {
    marginTop: spacing.xl,
    textAlign: "center",
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.brand.route,
  },
});
