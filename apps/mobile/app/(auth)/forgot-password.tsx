import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { radii } from "@depaso/design-tokens";
import { authClient } from "@/lib/apiClient";
import { classifyResetError, RESET_ERROR_MESSAGES } from "@/lib/auth/resetErrors";
import { AuthStep } from "@/components/auth/AuthStep";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";

/**
 * Recuperar contraseña, paso 1 de 3: el email. Las tres pantallas son rutas separadas
 * (`forgot-password` → `verify-code` → `new-password`) para que cada una tenga una sola
 * tarea y el botón "volver" lleve siempre al paso anterior.
 */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Escribí un email válido, por ejemplo nombre@correo.com.");
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      await authClient.forgotPassword({ email: trimmed });
      router.push({ pathname: "/(auth)/verify-code", params: { email: trimmed } });
    } catch (err) {
      setError(RESET_ERROR_MESSAGES[classifyResetError(err)]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthStep
      step={1}
      totalSteps={3}
      title="¿Olvidaste tu contraseña?"
      subtitle="Poné el email de tu cuenta. Te mandamos un código de 8 dígitos para confirmar que sos vos."
      onBack={() => router.back()}
      footer={
        <Button
          label={isSubmitting ? "Enviando..." : "Mandame el código"}
          onPress={() => void handleSubmit()}
          loading={isSubmitting}
          disabled={email.trim().length === 0}
          style={{ borderRadius: radii.full }}
        />
      }
    >
      <FormField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (error) setError(undefined);
        }}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="nombre@correo.com"
        returnKeyType="send"
        onSubmitEditing={() => void handleSubmit()}
        autoFocus
        error={error}
      />
    </AuthStep>
  );
}
