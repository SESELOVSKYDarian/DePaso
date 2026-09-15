import { ApiError } from "@depaso/api-client";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthHero } from "@/components/AuthHero";
import { Button } from "@/components/Button";
import { PillInput } from "@/components/PillInput";
import { SocialButton } from "@/components/SocialButton";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth/AuthContext";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Email o contraseña incorrectos.";
  }
  if (error instanceof ApiError && error.status === 429) {
    return "Demasiados intentos. Probá de nuevo en unos minutos.";
  }
  return "No pudimos iniciar sesión. Revisá tu conexión e intentá de nuevo.";
}

export default function LoginScreen() {
  const { login } = useAuth();
  const { show: showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Completá email y contraseña.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      // Sin navegación manual: Stack.Protected redirige solo al quedar autenticado.
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocial = (provider: "Google" | "Apple") => {
    showToast(`Ingresar con ${provider} todavía no está conectado (falta configurar credenciales OAuth).`, "info");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AuthHero title="Iniciá sesión" subtitle="Ahorrá en el camino, en serio." />

          <PillInput
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="Email"
          />
          <PillInput
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            isPassword
            autoComplete="password"
            placeholder="Contraseña"
          />

          <Button
            label="Olvidé mi contraseña"
            variant="ghost"
            onPress={() => showToast("Recuperar contraseña todavía no está disponible.", "info")}
            style={styles.forgotButton}
          />

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <Button
            label={isSubmitting ? "Ingresando..." : "Ingresar"}
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
            style={styles.pillButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialGroup}>
            <SocialButton provider="google" onPress={() => handleSocial("Google")} />
            <SocialButton provider="apple" onPress={() => handleSocial("Apple")} />
          </View>

          <Link href="/(auth)/register" style={styles.link}>
            ¿No tenés cuenta? Registrate
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
  forgotButton: {
    alignSelf: "flex-end",
    minHeight: 32,
    paddingVertical: 0,
    marginBottom: spacing.sm,
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
  socialGroup: {
    gap: spacing.sm,
  },
  link: {
    marginTop: spacing.xl,
    textAlign: "center",
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: "underline",
  },
});
