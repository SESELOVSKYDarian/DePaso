import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import * as Haptics from "expo-haptics";
import type { ColorTokens } from "@depaso/design-tokens";
import { useColors } from "@/lib/theme";
import {
  clearStoredNotifications,
  getStoredNotifications,
  setStoredNotifications,
} from "@/lib/auth/secureStore";
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

/** Un aviso ya mostrado, guardado en el historial de "Notificaciones". */
export interface InboxItem {
  id: string;
  title: string;
  message: string | null;
  variant: ToastVariant;
  icon: NotificationIcon;
  at: number;
  read: boolean;
}

interface InboxContextValue {
  items: InboxItem[];
  unreadCount: number;
  markAllRead: () => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const InboxContext = createContext<InboxContextValue | null>(null);

/** El almacén seguro es chico (≈2 KB en Android): se guardan pocos avisos y recortados. */
const MAX_INBOX_ITEMS = 12;
const MAX_MESSAGE_LENGTH = 90;

/** Título, ícono y color de acento por variante. El acento depende del tema (claro/oscuro). */
const variants = (colors: ColorTokens): Record<ToastVariant, { title: string; icon: NotificationIcon; accent: string }> => ({
  info: { title: "Aviso", icon: "information-circle", accent: colors.brand.navy },
  success: { title: "Listo", icon: "checkmark-circle", accent: colors.state.successStrong },
  error: { title: "No se pudo", icon: "alert-circle", accent: colors.state.errorStrong },
});

function parseInbox(raw: string | null): InboxItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is InboxItem =>
          typeof item === "object" && item !== null && typeof (item as InboxItem).id === "string",
      )
      .slice(0, MAX_INBOX_ITEMS);
  } catch {
    return [];
  }
}

function ToastBridge({ children }: { children: ReactNode }) {
  const { trigger } = useDynamicNotifications();
  const colors = useColors();
  const presets = useMemo(() => variants(colors), [colors]);
  const [items, setItems] = useState<InboxItem[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void getStoredNotifications().then((raw) => {
      if (cancelled) return;
      loaded.current = true;
      // Lo que llegó mientras cargaba queda arriba del historial guardado.
      setItems((current) => [...current, ...parseInbox(raw)].slice(0, MAX_INBOX_ITEMS));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    if (items.length === 0) {
      void clearStoredNotifications();
      return;
    }
    void setStoredNotifications(JSON.stringify(items)).catch(() => undefined);
  }, [items]);

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
      setItems((current) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title,
            message: message ? message.slice(0, MAX_MESSAGE_LENGTH) : null,
            variant,
            icon: icon ?? preset.icon,
            at: Date.now(),
            read: false,
          },
          ...current,
        ].slice(0, MAX_INBOX_ITEMS),
      );
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

  const markAllRead = useCallback(() => {
    setItems((current) => (current.some((item) => !item.read) ? current.map((item) => ({ ...item, read: true })) : current));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const toastValue = useMemo<ToastContextValue>(() => ({ show, notify }), [show, notify]);
  const inboxValue = useMemo<InboxContextValue>(
    () => ({ items, unreadCount: items.filter((item) => !item.read).length, markAllRead, clear }),
    [items, markAllRead, clear],
  );

  return (
    <ToastContext.Provider value={toastValue}>
      <InboxContext.Provider value={inboxValue}>{children}</InboxContext.Provider>
    </ToastContext.Provider>
  );
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

/** Historial de avisos mostrados, para la pantalla "Notificaciones". */
export function useNotificationInbox(): InboxContextValue {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useNotificationInbox debe usarse dentro de <ToastProvider>");
  return ctx;
}
