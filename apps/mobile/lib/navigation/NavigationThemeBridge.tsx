import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "expo-router";
import { useMemo, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";

/**
 * Tema de React Navigation alineado con el de la app: el fondo de las pantallas y las
 * tarjetas de transición usan la paleta activa, así no aparece un destello blanco al navegar
 * en modo oscuro.
 */
export function NavigationThemeBridge({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.brand.navy,
        background: colors.surface.base,
        card: colors.surface.base,
        text: colors.text.primary,
        border: colors.border.subtle,
        notification: colors.state.error,
      },
    };
  }, [colors, isDark]);

  return <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>;
}
