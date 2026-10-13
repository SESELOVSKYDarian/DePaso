import { ApiError } from "@depaso/api-client";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { PillInput } from "@/components/PillInput";
import { ProgressHeader } from "@/components/ProgressHeader";
import { authClient } from "@/lib/apiClient";
import { makeStyles } from "@/lib/theme";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "EMAIL_NOT_CONFIGURED") return "El envío de mails todavía no está activado en el servidor.";
    if (code === "RATE_LIMITED") return "Pediste muchos links seguidos. Probá de nuevo en un rato.";
    if (error.status === 400) return "Ese email no parece válido.";
  }
  return "No pudimos enviar el mail. Revisá tu conexión e intentá de nuevo.";
}

/** "Olvidé mi contraseña": manda un link al mail que abre una página para elegir la nueva. */
export default function ForgotPasswordScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Escribí el email de tu cuenta.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await authClient.forgotPassword({ email: trimmed });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ProgressHeader progress={0.3} onBack={() => router.back()} />

          {sent ? (
            <>
              <Text style={styles.title}>Revisá tu mail</Text>
              <Text style={styles.body}>
                Si {email.trim()} tiene una cuenta, te mandamos un link para elegir una contraseña nueva. Vale 30
                minutos. Fijate también en spam.
              </Text>
              <Button label="Volver a iniciar sesión" onPress={() => router.back()} style={styles.button} />
            </>
          ) : (
            <>
              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.body}>
                Poné el email de tu cuenta y te mandamos un link para que elijas una nueva.
              </Text>
              <PillInput
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                placeholder="Email"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label={isSubmitting ? "Enviando..." : "Mandame el link"}
                onPress={() => void handleSubmit()}
                disabled={isSubmitting}
                style={styles.button}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flex: 1,
      backgroundColor: colors.surface.base,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      fontFamily: typography.screenTitle.fontFamily,
      fontSize: 24,
      color: colors.text.primary,
      marginTop: spacing.lg,
    },
    body: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.secondary,
    },
    error: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      color: colors.state.errorStrong,
    },
    button: {
      borderRadius: radii.full,
      marginTop: spacing.sm,
    },
  }),
);
