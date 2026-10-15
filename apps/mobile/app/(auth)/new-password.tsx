import { PASSWORD_MIN_LENGTH } from "@depaso/domain";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { TextInput } from "react-native";
import { radii } from "@depaso/design-tokens";
import { authClient } from "@/lib/apiClient";
import { classifyResetError, RESET_ERROR_MESSAGES } from "@/lib/auth/resetErrors";
import { AuthStep } from "@/components/AuthStep";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";

/**
 * Recuperar contraseña, paso 3 de 3: la contraseña nueva, escrita dos veces. Sólo se llega acá
 * con un código ya verificado; el servidor lo vuelve a comprobar al guardar.
 */
export default function NewPasswordScreen() {
  const { show: showToast } = useToast();
  const { email = "", code = "" } = useLocalSearchParams<{ email?: string; code?: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmRef = useRef<TextInput>(null);

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN_LENGTH;
  const mismatch = touchedConfirm && confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= PASSWORD_MIN_LENGTH && confirm === password;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      await authClient.resetPassword({ email, code, password });
      showToast("Listo. Ya podés entrar con tu contraseña nueva.", "success");
      router.dismissTo("/(auth)/login");
    } catch (err) {
      setSubmitError(RESET_ERROR_MESSAGES[classifyResetError(err)]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthStep
      step={3}
      totalSteps={3}
      title="Elegí tu contraseña nueva"
      subtitle="Usala solo para DePaso. La escribís dos veces para evitar errores de tipeo."
      onBack={() => router.back()}
      footer={
        <>
          {submitError ? (
            <Button
              label="Pedir otro código"
              variant="secondary"
              onPress={() => router.dismissTo("/(auth)/forgot-password")}
              style={{ borderRadius: radii.full }}
            />
          ) : null}
          <Button
            label={isSubmitting ? "Guardando..." : "Guardar contraseña"}
            onPress={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={!canSubmit}
            style={{ borderRadius: radii.full }}
          />
        </>
      }
    >
      <FormField
        label="Contraseña nueva"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (submitError) setSubmitError(undefined);
        }}
        isPassword
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        autoFocus
        hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`}
        {...(tooShort ? { error: `Le faltan ${PASSWORD_MIN_LENGTH - password.length} caracteres.` } : {})}
      />
      <FormField
        inputRef={confirmRef}
        label="Repetí la contraseña"
        value={confirm}
        onChangeText={(value) => {
          setConfirm(value);
          setTouchedConfirm(true);
          if (submitError) setSubmitError(undefined);
        }}
        isPassword
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => void handleSubmit()}
        {...(mismatch
          ? { error: "Las contraseñas no coinciden." }
          : submitError
            ? { error: submitError }
            : confirm.length > 0 && confirm === password
              ? { hint: "Coinciden." }
              : {})}
      />
    </AuthStep>
  );
}
