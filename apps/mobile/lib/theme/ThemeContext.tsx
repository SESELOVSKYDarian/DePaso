import { darkColors, lightColors, type ColorTokens } from "@depaso/design-tokens";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Appearance, useColorScheme } from "react-native";
import { getStoredThemeMode, setStoredThemeMode, type StoredThemeMode } from "../auth/secureStore";

export type ThemeMode = StoredThemeMode;

interface ThemeContextValue {
  colors: ColorTokens;
  scheme: "light" | "dark";
  isDark: boolean;
  /** Preferencia del usuario: seguir el sistema o forzar claro/oscuro. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Avisa a React Native del esquema forzado. No existe en web (react-native-web): allá no hace falta. */
function applyNativeScheme(mode: ThemeMode): void {
  try {
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(mode === "system" ? "unspecified" : mode);
    }
  } catch {
    // Plataforma sin soporte: el tema propio sigue funcionando igual.
  }
}

/**
 * Tema claro/oscuro. Por defecto sigue al sistema. Si el usuario fuerza un modo se le avisa a
 * React Native (`Appearance.setColorScheme`) para que también cambien los componentes nativos
 * (teclado, alertas, blur) y no sólo los colores propios.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isReady, setIsReady] = useState(false);
  const systemScheme = useColorScheme();

  useEffect(() => {
    let cancelled = false;
    getStoredThemeMode()
      .then((stored) => {
        if (cancelled) return;
        setModeState(stored);
        applyNativeScheme(stored);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyNativeScheme(next);
    void setStoredThemeMode(next).catch(() => undefined);
  }, []);

  const scheme: "light" | "dark" = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === "dark" ? darkColors : lightColors,
      scheme,
      isDark: scheme === "dark",
      mode,
      setMode,
    }),
    [scheme, mode, setMode],
  );

  // Evita un destello del esquema equivocado: no se pinta nada hasta leer la preferencia.
  if (!isReady) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}

export function useColors(): ColorTokens {
  return useTheme().colors;
}
