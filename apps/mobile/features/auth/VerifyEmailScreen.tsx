import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { authClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { classifyResetError, RESET_ERROR_MESSAGES } from "@/lib/auth/resetErrors";
import { Button } from "@/components/common/Button";
import { OtpInput } from "@/components/common/OtpInput";
import { useToast } from "@/components/common/Toast";
import { makeStyles } from "@/lib/theme";

const CODE_LENGTH = 8;
const RESEND_SECONDS = 30;

/**
 * Confirmar el mail de una cuenta nueva: el código de 8 dígitos que llega al registrarse.
 * Al confirmarlo, `refreshUser` actualiza la sesión y la navegación sigue sola.
 */
export default function VerifyEmailScreen() {
  const styles = useStyles();
  const { show: showToast } = useToast();
  const { user, refreshUser, logout } = useAuth();
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

  const messageFor = (err: unknown) => {
    const kind = classifyResetError(err);
    // en este paso un 400 es un código que no sirve, no un mail mal escrito
    return RESET_ERROR_MESSAGES[kind === "invalid_email" ? "invalid_code" : kind];
  };

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || isVerifying) return;
    lastTried.current = value;
    setError(undefined);
    setIsVerifying(true);
    try {
      await authClient.verifyEmail({ code: value });
      await refreshUser();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    if (error) setError(undefined);
    // al completar los 8 dígitos (tipeados, pegados o autocompletados) se verifica solo
    if (value.length === CODE_LENGTH && value !== lastTried.current) void verify(value);
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    setIsResending(true);
    try {
      await authClient.sendEmailCode();
      setCode("");
      setError(undefined);
      lastTried.current = null;
      setSecondsLeft(RESEND_SECONDS);
      showToast("Te mandamos un código nuevo.", "success");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text accessibilityRole="header" style={styles.title}>
            Confirmá tu mail
          </Text>
          <Text style={styles.subtitle}>
            Te mandamos un código de 8 dígitos a <Text style={styles.email}>{user?.email}</Text>. Si no lo ves, fijate en spam.
          </Text>

          <View style={styles.otp}>
            <OtpInput value={code} onChange={handleChange} length={CODE_LENGTH} error={Boolean(error)} disabled={isVerifying} autoFocus />
          </View>

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              label={isResending ? "Enviando..." : secondsLeft > 0 ? `Reenviar código (${secondsLeft} s)` : "Reenviar código"}
              variant="ghost"
              onPress={() => void handleResend()}
              disabled={secondsLeft > 0 || isResending}
            />
            <Button label="Usar otra cuenta" variant="ghost" onPress={() => void logout()} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={isVerifying ? "Verificando..." : "Confirmar mail"}
            onPress={() => void verify(code)}
            loading={isVerifying}
            disabled={code.length !== CODE_LENGTH}
            style={{ borderRadius: radii.full }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.surface.base },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 32, lineHeight: 38, color: colors.text.primary },
    subtitle: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 15,
      lineHeight: 22,
      color: colors.text.secondary,
      marginTop: spacing.sm,
    },
    email: { fontFamily: typography.itemTitle.fontFamily, color: colors.text.primary },
    otp: { marginTop: spacing.xl },
    error: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 13,
      lineHeight: 18,
      color: colors.state.errorStrong,
      marginTop: spacing.sm,
    },
    actions: { marginTop: spacing.lg, alignItems: "flex-start" },
    footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  }),
);
