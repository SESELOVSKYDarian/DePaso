import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ProgressHeader } from "@/components/ProgressHeader";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth/AuthContext";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 56;

/**
 * Verificación de email por código (depaso-verificar-email en Figma). El backend todavía no
 * tiene envío/verificación de OTP (no hay endpoint ni campo `emailVerified` en
 * `@depaso/domain` — ver `packages/domain/src/auth.ts`), así que el código no se valida de
 * verdad: se avisa por toast, igual que el resto de las integraciones no conectadas
 * (Google/Apple en `SocialButton`), y "Continuar" no queda bloqueado por eso.
 */
export default function VerifyEmailScreen() {
  const { user } = useAuth();
  const { show: showToast } = useToast();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleChangeDigit = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    showToast("El envío de códigos por email todavía no está conectado.", "info");
  };

  const handleContinue = () => {
    router.push("/(setup)/location");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <ProgressHeader progress={0.55} onBack={() => router.back()} />
      </View>

      <View style={styles.content}>
        <Image source={require("../../assets/images/mail.png")} style={styles.illustration} resizeMode="contain" />
        <Text style={styles.title}>Verificá tu email</Text>
        <Text style={styles.subtitle}>
          Te enviamos un código a{"\n"}
          <Text style={styles.email}>{user?.email ?? "tu email"}</Text>
        </Text>

        <View style={styles.codeRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(node) => {
                inputRefs.current[i] = node;
              }}
              value={digit}
              onChangeText={(v) => handleChangeDigit(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.codeBox, digit ? styles.codeBoxFilled : null]}
              accessibilityLabel={`Dígito ${i + 1} del código`}
            />
          ))}
        </View>

        <Text style={styles.resendRow}>
          ¿No te llegó el código?{" "}
          <Text
            style={[styles.resendLink, secondsLeft > 0 ? styles.resendLinkDisabled : null]}
            onPress={handleResend}
          >
            {secondsLeft > 0 ? `Reenviar (${secondsLeft}s)` : "Reenviar"}
          </Text>
        </Text>
      </View>

      <View style={styles.footer}>
        <AnimatedPressable accessibilityLabel="Continuar" onPress={handleContinue} style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>Continuar</Text>
        </AnimatedPressable>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  illustration: {
    width: 180,
    height: 150,
    marginBottom: spacing.lg,
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
  email: {
    color: colors.text.primary,
  },
  codeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.input,
    textAlign: "center",
    fontFamily: typography.body.fontFamily,
    fontSize: 20,
    color: colors.text.primary,
  },
  codeBoxFilled: {
    borderColor: colors.brand.navy,
  },
  resendRow: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: "center",
  },
  resendLink: {
    color: colors.text.primary,
  },
  resendLinkDisabled: {
    color: colors.text.secondary,
  },
  footer: {
    padding: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  primaryLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    color: colors.text.onNavy,
  },
});
