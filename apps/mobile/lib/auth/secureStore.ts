import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "depaso_session_token";
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

export async function getStoredToken(): Promise<string | null> {
  return store.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await store.setItem(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await store.deleteItem(TOKEN_KEY);
}

export async function getOnboardingSeen(): Promise<boolean> {
  return (await store.getItem(ONBOARDING_SEEN_KEY)) === "true";
}

export async function setOnboardingSeen(): Promise<void> {
  await store.setItem(ONBOARDING_SEEN_KEY, "true");
}
