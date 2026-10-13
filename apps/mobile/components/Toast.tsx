import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import * as Haptics from "expo-haptics";
import type { ColorTokens } from "@depaso/design-tokens";
import { useColors } from "@/lib/theme";
import {
  DynamicNotifications,
  useDynamicNotifications,
  type AppNotification,
  type NotificationIcon,
} from "./dynamic-notifications";

type ToastVariant = "info" | "success" | "error";

interface NotifyOptions {
  title: string;
  message?: string;
  variant?: ToastVariant;
  icon?: NotificationIcon;
  /** ms visible; `null` = hasta que el usuario la cierre. */
  duration?: number | null;
  onPress?: () => void;
}

interface ToastContextValue {
  /** Aviso corto. Mantiene la API histórica de toasts: un texto y una variante. */
  show: (message: string, variant?: ToastVariant) => void;
  /** Notificación con título propio, ícono y acción al tocar. */
  notify: (options: NotifyOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Título, ícono y color de acento por variante. El acento depende del tema (claro/oscuro). */
const variants = (colors: ColorTokens): Record<ToastVariant, { title: string; icon: NotificationIcon; accent: string }> => ({
  info: { title: "Aviso", icon: "information-circle", accent: colors.brand.navy },
  success: { title: "Listo", icon: "checkmark-circle", accent: colors.state.successStrong },
  error: { title: "No se pudo", icon: "alert-circle", accent: colors.state.errorStrong },
});

function ToastBridge({ children }: { children: ReactNode }) {
  const { trigger } = useDynamicNotifications();
  const colors = useColors();
  const presets = useMemo(() => variants(colors), [colors]);

  const notify = useCallback(
    ({ title, message, variant = "info", icon, duration, onPress }: NotifyOptions) => {
      const preset = presets[variant];
      const notification: AppNotification = {
        title,
        icon: icon ?? preset.icon,
        accent: preset.accent,
        ...(message !== undefined ? { message } : {}),
        ...(duration !== undefined ? { duration } : {}),
        ...(onPress ? { onPress } : {}),
      };
      trigger(notification);
      // Un toast aparece fuera del foco: sin esto un lector de pantalla nunca se entera.
      AccessibilityInfo.announceForAccessibility([title, message].filter(Boolean).join(". "));
      // Sólo el éxito lleva háptico: los errores pueden venir de cargas automáticas, sin gesto.
      if (variant === "success") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [trigger, presets],
  );

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      notify({ title: presets[variant].title, message, variant });
    },
    [notify, presets],
  );

  const value = useMemo<ToastContextValue>(() => ({ show, notify }), [show, notify]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/** Notificaciones tipo "Dynamic Island" del catálogo (sección 74). Una activa a la vez. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <DynamicNotifications>
      <ToastBridge>{children}</ToastBridge>
    </DynamicNotifications>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
