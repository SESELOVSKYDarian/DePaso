import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { notificationsClient } from "@/lib/apiClient";
import { getStoredValue, setStoredValue } from "@/lib/auth/secureStore";

/**
 * Notificaciones del celular (las que salen en la barra del sistema, no las de adentro de la app).
 * Hay dos tipos: las que manda el servidor (anuncios, ofertas, listas compartidas), que necesitan
 * el token de Expo Push, y las locales que programa la propia app (por ejemplo, al empezar la ruta).
 *
 * Nada de esto existe en la web ni en Expo Go de Android (Expo lo sacó): ahí las funciones no
 * hacen nada y devuelven un motivo, sin tirar error.
 */

const TOKEN_KEY = "depaso_push_token";
const ROUTE_ENABLED_KEY = "depaso_notify_route";
const ASKED_KEY = "depaso_notify_asked";

export type PermissionState = "granted" | "denied" | "undetermined" | "unsupported";
export type RegisterResult = { ok: true; token: string } | { ok: false; reason: "unsupported" | "denied" | "no_project" | "failed" };

const isWeb = Platform.OS === "web";
/** Expo Go en Android ya no soporta avisos remotos (desde el SDK 53): hace falta la app instalada (APK). */
const isAndroidExpoGo = Platform.OS === "android" && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Cómo se muestra un aviso si llega con la app abierta: igual aparece como cartel arriba. */
export function configureForegroundNotifications(): void {
  if (isWeb) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** En Android los avisos necesitan un canal; se crea con la marca de DePaso. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Avisos de DePaso",
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: "#7CB0FF",
    vibrationPattern: [0, 200, 100, 200],
  });
}

export async function getPermissionState(): Promise<PermissionState> {
  if (isWeb || isAndroidExpoGo) return "unsupported";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "granted";
    return status === "undetermined" ? "undetermined" : "denied";
  } catch {
    return "unsupported";
  }
}

/** Pide permiso al sistema (sale el cartel de Android/iOS). */
export async function requestPermission(): Promise<PermissionState> {
  if (isWeb || isAndroidExpoGo) return "unsupported";
  try {
    await ensureChannel();
    const { status } = await Notifications.requestPermissionsAsync();
    await setStoredValue(ASKED_KEY, "1");
    return status === "granted" ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}

/** `true` si ya se le preguntó a la persona si quiere recibir avisos. */
export async function wasAskedAboutNotifications(): Promise<boolean> {
  return (await getStoredValue(ASKED_KEY)) === "1";
}

/** Marca que ya se le preguntó (aunque haya dicho "ahora no"), para no insistir en cada arranque. */
export async function markAskedAboutNotifications(): Promise<void> {
  await setStoredValue(ASKED_KEY, "1");
}

/** Saca el token del celular y se lo manda al servidor. Hay que tener el permiso concedido. */
export async function registerPushToken(): Promise<RegisterResult> {
  if (isWeb || isAndroidExpoGo || !Device.isDevice) return { ok: false, reason: "unsupported" };
  try {
    if ((await getPermissionState()) !== "granted") return { ok: false, reason: "denied" };
    await ensureChannel();
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return { ok: false, reason: "no_project" };
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await notificationsClient.registerToken({ token, platform: Platform.OS === "ios" ? "ios" : "android" });
    await setStoredValue(TOKEN_KEY, token);
    return { ok: true, token };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** Le avisa al servidor que este celular ya no quiere avisos (al cerrar sesión o apagarlos). */
export async function unregisterPushToken(): Promise<void> {
  const token = await getStoredValue(TOKEN_KEY);
  if (!token) return;
  try {
    await notificationsClient.unregisterToken(token);
    await setStoredValue(TOKEN_KEY, "");
  } catch {
    // sin conexión: queda registrado y el servidor lo limpia solo si deja de existir
  }
}

/** Si el aviso de "empezaste tu recorrido" está activo en este celular (por defecto sí). */
export async function isRouteNotificationEnabled(): Promise<boolean> {
  return (await getStoredValue(ROUTE_ENABLED_KEY)) !== "off";
}

export async function setRouteNotificationEnabled(enabled: boolean): Promise<void> {
  await setStoredValue(ROUTE_ENABLED_KEY, enabled ? "on" : "off");
}

/** Muestra un aviso en el celular ahora mismo, sin pasar por el servidor. No hace nada sin permiso. */
export async function showLocalNotification(input: { title: string; body: string; data?: Record<string, unknown> }): Promise<void> {
  if (isWeb || isAndroidExpoGo) return;
  try {
    if ((await getPermissionState()) !== "granted") return;
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title: input.title, body: input.body, ...(input.data ? { data: input.data } : {}), sound: "default" },
      trigger: null,
    });
  } catch {
    // un aviso que no sale no debe romper el flujo de compra
  }
}
