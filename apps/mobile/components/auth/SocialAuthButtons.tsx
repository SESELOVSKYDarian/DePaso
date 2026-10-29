import { ApiError } from "@depaso/api-client";
import type { OAuthLoginRequest, OAuthProviderId, OAuthProvidersResponse } from "@depaso/validation";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@depaso/design-tokens";
import { authClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { SocialButton, type SocialProvider } from "./SocialButton";
import { useToast } from "../common/Toast";

type ProviderInfo = OAuthProvidersResponse["providers"][number];

const ORDER: Array<Exclude<SocialProvider, "email"> & OAuthProviderId> = ["google", "facebook", "discord"];
const LABELS: Record<OAuthProviderId, string> = { google: "Google", facebook: "Meta", discord: "Discord" };

interface SocialAuthButtonsProps {
  mode: "login" | "register";
  /** En `register`, la aceptación legal ya marcada. Sin ella no se inicia el flujo. */
  consent?: OAuthLoginRequest["consent"] | null;
  /** Sólo elegir el método: no inicia sesión, avisa cuál se tocó (paso previo a las declaraciones). */
  onSelect?: (id: OAuthProviderId) => void;
  /** Muestra un único proveedor. */
  only?: OAuthProviderId;
  /** Se llama cuando falta el consentimiento, para que la pantalla lo resalte. */
  onConsentMissing?: () => void;
}

function errorMessage(error: unknown, label: string): string {
  if (error instanceof ApiError) {
    const code = (error.body as { error?: string } | null)?.error;
    if (code === "PROVIDER_NOT_CONFIGURED") return `${label} todavía no está activado en el servidor.`;
    if (code === "EMAIL_UNAVAILABLE") return `Tu cuenta de ${label} no comparte un email verificado, no podemos usarla.`;
    if (code === "RATE_LIMITED") return "Demasiados intentos. Probá de nuevo en unos minutos.";
    if (code === "INVALID_CREDENTIALS") return "Esa cuenta fue eliminada. Usá otro método.";
  }
  return `No pudimos ingresar con ${label}. Probá de nuevo.`;
}

/** Google, Meta y Discord. La misma lógica sirve para iniciar sesión y para crear la cuenta. */
export function SocialAuthButtons({ mode, consent, onConsentMissing, onSelect, only }: SocialAuthButtonsProps) {
  const styles = useStyles();
  const { loginWithOAuth } = useAuth();
  const { show: showToast } = useToast();
  const [providers, setProviders] = useState<Record<string, ProviderInfo> | null>(null);
  const [busy, setBusy] = useState<OAuthProviderId | null>(null);

  useEffect(() => {
    let cancelled = false;
    authClient
      .providers()
      .then(({ providers: list }) => {
        if (!cancelled) setProviders(Object.fromEntries(list.map((p) => [p.id, p])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePress = async (id: OAuthProviderId) => {
    const label = LABELS[id];
    if (onSelect) {
      onSelect(id);
      return;
    }
    if (mode === "register" && !consent) {
      onConsentMissing?.();
      showToast("Marcá que sos mayor de edad y aceptá los términos para seguir.", "info");
      return;
    }

    let info = providers?.[id];
    if (!info) {
      try {
        const { providers: list } = await authClient.providers();
        const map = Object.fromEntries(list.map((p) => [p.id, p]));
        setProviders(map);
        info = map[id];
      } catch {
        showToast("No pudimos conectar con el servidor. Revisá tu conexión.", "error");
        return;
      }
    }
    if (!info || !info.configured || !info.clientId) {
      showToast(`${label} todavía no está activado: falta cargar sus claves en el servidor.`, "info");
      return;
    }

    setBusy(id);
    try {
      // Se carga recién al tocar: usa módulos nativos (expo-crypto) que algunas versiones de
      // Expo Go no traen. Importarlo arriba rompía la pantalla de login entera.
      let oauth: typeof import("@/lib/auth/oauth");
      try {
        oauth = await import("@/lib/auth/oauth");
      } catch {
        showToast(`El ingreso con ${label} no está disponible en esta versión de la app. Usá email y contraseña.`, "info");
        return;
      }
      const authorization = await oauth.requestAuthorizationCode({
        clientId: info.clientId,
        authorizationEndpoint: info.authorizationEndpoint,
        scopes: info.scopes,
      });
      if (!authorization) return;
      await loginWithOAuth(id, { ...authorization, ...(mode === "register" && consent ? { consent } : {}) });
      // Sin navegación manual: Stack.Protected redirige solo al quedar autenticado.
    } catch (error) {
      if (error instanceof ApiError && (error.body as { error?: string } | null)?.error === "ACCOUNT_NOT_FOUND") {
        showToast("No encontramos una cuenta con ese email. Creala primero.", "info");
        router.push("/(auth)/register");
        return;
      }
      showToast(errorMessage(error, label), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.group}>
      {ORDER.filter((id) => !only || id === only).map((id) => (
        <SocialButton
          key={id}
          provider={id}
          loading={busy === id}
          disabled={busy !== null && busy !== id}
          onPress={() => void handlePress(id)}
        />
      ))}
    </View>
  );
}

const useStyles = () => styles;
const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
});
