import { ApiError } from "@depaso/api-client";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { MIN_AGE_YEARS, PASSWORD_MIN_LENGTH } from "@depaso/domain";
import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/FormField";
import { ProgressHeader } from "@/components/ProgressHeader";
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

/**
 * Formulario de registro con email (depaso-registro-email en Figma). El diseño visual sólo
 * muestra un aviso de pie ("Al continuar, aceptás..."), pero docs/legal-functional/LEGAL.md
 * (sección "Arquitectura de consentimiento", p.6) exige checkboxes específicos y revocables
 * para edad/T&C/privacidad — no alcanza un aviso pasivo. Se mantienen como bloque compacto
 * debajo de la contraseña para no perder esa fidelidad visual del resto de la pantalla.
 */
export default function RegisterEmailScreen() {
  const { register } = useAuth();
  const { show: showToast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
    if (!firstName.trim()) nextFieldErrors.firstName = "Ingresá tu nombre.";
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
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      await register({
        email,
        password,
        displayName: displayName || undefined,
        ageConfirmed18Plus: true,
        acceptTerms: true,
        acceptPrivacyNotice: true,
        marketingOptIn,
      });
      router.replace("/(setup)/verify-email");
    } catch (err) {
      setError(registerErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.4} onBack={() => router.back()} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Registrate con Email</Text>
          <Text style={styles.subtitle}>Completá tus datos para crear tu cuenta.</Text>

          <FormField label="Nombre" value={firstName} onChangeText={setFirstName} placeholder="Juan" error={fieldErrors.firstName} />
          <FormField label="Apellido" value={lastName} onChangeText={setLastName} placeholder="Pérez" />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="juan.perez@gmail.com"
            error={fieldErrors.email}
          />
          <FormField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            isPassword
            autoComplete="password-new"
            placeholder="••••••••••"
            hint={fieldErrors.password ? undefined : `Mínimo ${PASSWORD_MIN_LENGTH} caracteres, con una letra y un número.`}
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

          <AnimatedPressable
            accessibilityLabel={isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
            onPress={isSubmitting ? undefined : () => void handleSubmit()}
            haptic={!isSubmitting}
            style={[styles.submitButton, isSubmitting ? styles.submitButtonDisabled : null]}
          >
            <Text style={styles.submitLabel}>{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</Text>
          </AnimatedPressable>

          <Text style={styles.footerNote}>
            Al continuar, aceptás nuestros{" "}
            <Link href="/legal/terms" style={styles.inlineLink}>
              Términos y Condiciones
            </Link>{" "}
            y{" "}
            <Link href="/legal/privacy" style={styles.inlineLink}>
              Política de Privacidad
            </Link>
            .
          </Text>
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
  header: {
    paddingHorizontal: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
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
    marginTop: spacing.xs,
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
  errorBanner: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.state.error,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    fontFamily: typography.buttonLabel.fontFamily,
    fontSize: 16,
    color: colors.text.onNavy,
  },
  footerNote: {
    fontFamily: typography.legal.fontFamily,
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
