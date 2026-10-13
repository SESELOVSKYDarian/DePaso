import { ApiError } from "@depaso/api-client";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { PASSWORD_MIN_LENGTH } from "@depaso/domain";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { PillInput } from "@/components/PillInput";
import { ProgressHeader } from "@/components/ProgressHeader";
import { useToast } from "@/components/Toast";
import { authClient } from "@/lib/apiClient";
import { makeStyles } from "@/lib/theme";

const CODE_LENGTH = 8;

function requestErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "EMAIL_NOT_CONFIGURED") return "El envío de mails todavía no está activado en el servidor.";
    if (code === "RATE_LIMITED") return "Pediste muchos códigos seguidos. Probá de nuevo en un rato.";
    if (error.status === 400) return "Ese email no parece válido.";
  }
  return "No pudimos enviar el mail. Revisá tu conexión e intentá de nuevo.";
}

function resetErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "INVALID_OR_EXPIRED_TOKEN") return "El código es incorrecto o ya venció. Pedí uno nuevo.";
    if (code === "RATE_LIMITED") return "Demasiados intentos. Esperá unos minutos y probá de nuevo.";
  }
  return "No pudimos cambiar la contraseña. Revisá tu conexión e intentá de nuevo.";
}

/**
 * "Olvidé mi contraseña", sin salir de la app: 1) se pide el mail, 2) se escribe el código de
 * 8 dígitos que llega y se elige la contraseña nueva. El mail incluye además un link web de
 * respaldo (`/reset-password`) por si el código no se puede tipear.
 */
export default function ForgotPasswordScreen() {
  const styles = useStyles();
  const { show: showToast } = useToast();
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Escribí el email de tu cuenta.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await authClient.forgotPassword({ email: trimmed });
      setStep("code");
    } catch (err) {
      setError(requestErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (code.length !== CODE_LENGTH) {
      setError(`El código tiene ${CODE_LENGTH} dígitos.`);
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`La contraseña necesita al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await authClient.resetPassword({ email: email.trim(), code, password });
      showToast("Listo. Ya podés entrar con tu contraseña nueva.", "success");
      router.back();
    } catch (err) {
      setError(resetErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ProgressHeader
            progress={step === "email" ? 0.3 : 0.7}
            onBack={() => (step === "code" ? setStep("email") : router.back())}
          />

          {step === "email" ? (
            <>
              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.body}>
                Poné el email de tu cuenta y te mandamos un código para que elijas una nueva, sin salir de la app.
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
                label={isSubmitting ? "Enviando..." : "Mandame el código"}
                onPress={() => void handleRequestCode()}
                disabled={isSubmitting}
                style={styles.button}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>Revisá tu mail</Text>
              <Text style={styles.body}>
                Si {email.trim()} tiene una cuenta, te mandamos un código de {CODE_LENGTH} dígitos. Escribilo acá y
                elegí tu contraseña nueva. Fijate también en spam.
              </Text>
              <PillInput
                icon="keypad-outline"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={CODE_LENGTH}
                placeholder={`Código de ${CODE_LENGTH} dígitos`}
              />
              <PillInput
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoComplete="new-password"
                textContentType="newPassword"
                placeholder="Contraseña nueva"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                label={isSubmitting ? "Guardando..." : "Cambiar contraseña"}
                onPress={() => void handleReset()}
                disabled={isSubmitting}
                style={styles.button}
              />
              <Button
                label="Pedir otro código"
                variant="ghost"
                onPress={() => {
                  setCode("");
                  setError(null);
                  setStep("email");
                }}
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
