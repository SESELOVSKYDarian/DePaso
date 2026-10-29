import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { authClient } from "@/lib/apiClient";
import { codeStepErrorKind, RESET_ERROR_MESSAGES } from "@/lib/auth/resetErrors";
import { AuthStep } from "@/components/auth/AuthStep";
import { Button } from "@/components/common/Button";
import { OtpInput } from "@/components/common/OtpInput";
import { useToast } from "@/components/common/Toast";
import { makeStyles } from "@/lib/theme";

const CODE_LENGTH = 8;
const RESEND_SECONDS = 30;

/**
 * Recuperar contraseña, paso 2 de 3: el código del mail. Se verifica en el servidor antes de
 * dejar pasar al paso 3: la pantalla de "contraseña nueva" sólo se abre con un código válido.
 */
export default function VerifyCodeScreen() {
  const styles = useStyles();
  const { show: showToast } = useToast();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const lastTried = useRef<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || isVerifying) return;
    lastTried.current = value;
    setError(undefined);
    setIsVerifying(true);
    try {
      await authClient.verifyResetCode({ email, code: value });
      router.push({ pathname: "/(auth)/new-password", params: { email, code: value } });
    } catch (err) {
      setError(RESET_ERROR_MESSAGES[codeStepErrorKind(err)]);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    if (error) setError(undefined);
    // Al completar los 8 dígitos (tipeados, pegados o autocompletados) se verifica solo.
    if (value.length === CODE_LENGTH && value !== lastTried.current) void verify(value);
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    setIsResending(true);
    try {
      await authClient.forgotPassword({ email });
      setCode("");
      setError(undefined);
      lastTried.current = null;
      setSecondsLeft(RESEND_SECONDS);
      showToast("Te mandamos un código nuevo.", "success");
    } catch (err) {
      setError(RESET_ERROR_MESSAGES[codeStepErrorKind(err)]);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthStep
      step={2}
      totalSteps={3}
      title="Ingresá el código"
      subtitle={
        <>
          Lo mandamos a <Text style={styles.email}>{email}</Text>. Si no lo ves, fijate en spam.
        </>
      }
      onBack={() => router.back()}
      footer={
        <Button
          label={isVerifying ? "Verificando..." : "Verificar código"}
          onPress={() => void verify(code)}
          loading={isVerifying}
          disabled={code.length !== CODE_LENGTH}
          style={{ borderRadius: radii.full }}
        />
      }
    >
      <OtpInput
        value={code}
        onChange={handleChange}
        length={CODE_LENGTH}
        error={Boolean(error)}
        disabled={isVerifying}
        autoFocus
      />

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={
            isResending ? "Enviando..." : secondsLeft > 0 ? `Reenviar código (${secondsLeft} s)` : "Reenviar código"
          }
          variant="ghost"
          onPress={() => void handleResend()}
          disabled={secondsLeft > 0 || isResending}
        />
        <Button label="Usar otro email" variant="ghost" onPress={() => router.back()} />
      </View>
    </AuthStep>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    email: {
      fontFamily: typography.itemTitle.fontFamily,
      color: colors.text.primary,
    },
    error: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.state.errorStrong,
      marginTop: spacing.sm,
    },
    actions: {
      marginTop: spacing.lg,
      alignItems: "flex-start",
    },
  }),
);
