import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "depaso_session_token";
const REFRESH_TOKEN_KEY = "depaso_refresh_token";
const ONBOARDING_SEEN_KEY = "depaso_onboarding_seen";

/**
 * `expo-secure-store` no tiene equivalente real en web (no hay un keychain de browser
 * estandarizado) — en `Platform.OS === "web"` cae a `localStorage`, sólo para que la
 * preview de Expo Web (herramienta de desarrollo, sección 91: la web no es el producto
 * principal) sea usable. La build nativa real (Android/iOS) siempre usa SecureStore.
 */
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(key);
  },
};

const store =
  Platform.OS === "web"
    ? webStorage
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        deleteItem: SecureStore.deleteItemAsync,
      };

/** Access token guardado en el celular (o null si no hay sesión). */
export async function getStoredToken(): Promise<string | null> {
  return store.getItem(TOKEN_KEY);
}

/** Guarda solo el access token (el refresh se guarda con `setStoredSession`). */
export async function setStoredToken(token: string): Promise<void> {
  await store.setItem(TOKEN_KEY, token);
}

/** Refresh token guardado, el que sirve para pedir un access token nuevo. */
export async function getStoredRefreshToken(): Promise<string | null> {
  return store.getItem(REFRESH_TOKEN_KEY);
}

/** Guarda el par de tokens de la sesión: access (corto) + refresh (largo). */
export async function setStoredSession(accessToken: string, refreshToken: string): Promise<void> {
  await store.setItem(TOKEN_KEY, accessToken);
  await store.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/** Borra los dos tokens: así se cierra la sesión en este celular. */
export async function clearStoredToken(): Promise<void> {
  await store.deleteItem(TOKEN_KEY);
  await store.deleteItem(REFRESH_TOKEN_KEY);
}

const THEME_MODE_KEY = "depaso_theme_mode";

export type StoredThemeMode = "system" | "light" | "dark";

/** Preferencia de apariencia del usuario (no es un secreto, pero comparte el mismo almacén). */
export async function getStoredThemeMode(): Promise<StoredThemeMode> {
  const value = await store.getItem(THEME_MODE_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

/** Guarda si el usuario quiere tema claro, oscuro o el del sistema. */
export async function setStoredThemeMode(mode: StoredThemeMode): Promise<void> {
  await store.setItem(THEME_MODE_KEY, mode);
}

/** `true` si el usuario ya vio la bienvenida. */
export async function getOnboardingSeen(): Promise<boolean> {
  return (await store.getItem(ONBOARDING_SEEN_KEY)) === "true";
}

/** Marca la bienvenida como vista para no mostrarla de nuevo. */
export async function setOnboardingSeen(): Promise<void> {
  await store.setItem(ONBOARDING_SEEN_KEY, "true");
}

const NOTIFICATIONS_KEY = "depaso_notification_inbox";

/** Historial de avisos mostrados (JSON). Se recorta antes de guardar: el almacén seguro es chico. */
export async function getStoredNotifications(): Promise<string | null> {
  return store.getItem(NOTIFICATIONS_KEY);
}

/** Guarda el historial de avisos (texto JSON ya recortado). */
export async function setStoredNotifications(json: string): Promise<void> {
  await store.setItem(NOTIFICATIONS_KEY, json);
}

/** Borra el historial de avisos guardado. */
export async function clearStoredNotifications(): Promise<void> {
  await store.deleteItem(NOTIFICATIONS_KEY);
}

const TODAY_ROUTE_KEY = "depaso_today_route";

/** Recorrido de hoy guardado (texto JSON con el día y el usuario). */
export async function getStoredTodayRoute(): Promise<string | null> {
  return store.getItem(TODAY_ROUTE_KEY);
}

/** Guarda el recorrido de hoy (texto JSON ya compacto). */
export async function setStoredTodayRoute(json: string): Promise<void> {
  await store.setItem(TODAY_ROUTE_KEY, json);
}

/** Borra el recorrido de hoy guardado. */
export async function clearStoredTodayRoute(): Promise<void> {
  await store.deleteItem(TODAY_ROUTE_KEY);
}

const DETOUR_KEY = "depaso_detour_blocks";

export interface StoredDetourBlocks {
  strict: number;
  intermediate: number;
}

/** Cuántas cuadras se acepta desviarse en cada nivel de compra (preferencia del dispositivo). */
export async function getStoredDetourBlocks(): Promise<StoredDetourBlocks | null> {
  const raw = await store.getItem(DETOUR_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredDetourBlocks>;
    if (typeof parsed.strict === "number" && typeof parsed.intermediate === "number") {
      return { strict: parsed.strict, intermediate: parsed.intermediate };
    }
  } catch {
    // Valor corrupto: se usan los de fábrica.
  }
  return null;
}

/** Guarda cuántas cuadras de desvío acepta el usuario en cada nivel. */
export async function setStoredDetourBlocks(blocks: StoredDetourBlocks): Promise<void> {
  await store.setItem(DETOUR_KEY, JSON.stringify(blocks));
}
