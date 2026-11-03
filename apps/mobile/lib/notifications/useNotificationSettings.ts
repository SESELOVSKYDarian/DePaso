import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from "@depaso/validation";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { notificationsClient } from "@/lib/apiClient";
import {
  getPermissionState,
  registerPushToken,
  requestPermission,
  setRouteNotificationEnabled,
  unregisterPushToken,
  type PermissionState,
} from "./push";

/**
 * Estado de los avisos del celular: si el sistema dio permiso y qué categorías quiere la
 * persona. Activar una categoría pide el permiso si todavía no se dio.
 */
export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permission, setPermission] = useState<PermissionState>("undetermined");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | undefined>();

  const refreshPermission = useCallback(async () => setPermission(await getPermissionState()), []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [state, remote] = await Promise.all([getPermissionState(), notificationsClient.settings().catch(() => null)]);
      if (!active) return;
      setPermission(state);
      if (remote) {
        setSettings(remote);
        await setRouteNotificationEnabled(remote.routes);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  /** Activa los avisos del celular: pide permiso y registra el token. */
  const enable = useCallback(async () => {
    setMessage(undefined);
    let state = await getPermissionState();
    if (state === "undetermined") state = await requestPermission();
    setPermission(state);
    if (state === "granted") {
      const result = await registerPushToken();
      if (!result.ok && result.reason === "failed") setMessage("No pudimos activar los avisos. Probá de nuevo en un rato.");
    } else if (state === "denied") {
      setMessage("Los avisos están bloqueados en el celular. Activalos desde los ajustes del sistema.");
    } else {
      setMessage("Los avisos del celular funcionan en la app instalada (no en Expo Go ni en la web).");
    }
    return state === "granted";
  }, []);

  const disable = useCallback(async () => {
    await unregisterPushToken();
    await refreshPermission();
  }, [refreshPermission]);

  /** Prende o apaga una categoría; al prender la primera se piden los permisos. */
  const toggle = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      if (value && permission !== "granted") {
        const granted = await enable();
        if (!granted && key !== "routes") return;
      }
      setSettings((current) => ({ ...current, [key]: value }));
      try {
        const saved = await notificationsClient.updateSettings({ [key]: value });
        setSettings(saved);
        if (key === "routes") await setRouteNotificationEnabled(value);
      } catch {
        setSettings((current) => ({ ...current, [key]: !value }));
        setMessage("No pudimos guardar el cambio. Revisá tu conexión.");
      }
    },
    [permission, enable],
  );

  const openSystemSettings = useCallback(() => void Linking.openSettings(), []);

  return { settings, permission, loading, message, enable, disable, toggle, openSystemSettings };
}
