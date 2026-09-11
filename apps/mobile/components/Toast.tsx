import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";

type ToastVariant = "info" | "success" | "error";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 2600;

/** Sistema de toasts del catálogo (sección 74) — un toast activo a la vez, se
 * autodescarta; tocar lo cierra antes. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    nextId.current += 1;
    const id = nextId.current;
    setToast({ id, message, variant });
    timeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, AUTO_DISMISS_MS);
  }, []);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(220)}
          exiting={FadeOutDown.duration(180)}
          style={styles.wrapper}
          pointerEvents="box-none"
        >
          <Pressable onPress={dismiss} style={[styles.toast, VARIANT_STYLES[toast.variant]]}>
            <Text style={styles.text}>{toast.message}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const VARIANT_STYLES = {
  info: { backgroundColor: colors.brand.navy },
  success: { backgroundColor: colors.state.success },
  error: { backgroundColor: colors.state.error },
} as const;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxxl,
    alignItems: "center",
  },
  toast: {
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: 480,
  },
  text: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "500",
    fontSize: 14,
    color: colors.text.onNavy,
    textAlign: "center",
  },
});
