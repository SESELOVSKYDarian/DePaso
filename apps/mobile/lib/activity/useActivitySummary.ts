import type { ActivitySummary } from "@depaso/validation";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { activityClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";

const EMPTY: ActivitySummary = { badge: 0, merchantRequests: 0, adRequests: 0 };
const REFRESH_EVERY_MS = 60_000;

/**
 * Los numeritos de la app: cuántas cosas esperan una respuesta (en Actividad y, para el
 * administrador, en cada sección). Se actualiza al abrir, al volver a la app y cada minuto.
 */
export function useActivitySummary() {
  const { isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<ActivitySummary>(EMPTY);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setSummary(await activityClient.summary());
    } catch {
      // sin conexión: queda el último numerito
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSummary(EMPTY);
      return;
    }
    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_EVERY_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [isAuthenticated, refresh]);

  return { summary, refresh };
}
