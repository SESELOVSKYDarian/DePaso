import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import { SplashScreen } from "@/components/common/SplashScreen";
import { ThemedRoot } from "@/components/common/ThemedRoot";
import { RootNavigator } from "@/features/navigation/RootNavigator";
import { AppProviders } from "@/lib/AppProviders";
import { NavigationThemeBridge } from "@/lib/navigation/NavigationThemeBridge";
import { ThemeProvider } from "@/lib/theme";
import { useAppFonts } from "@/lib/useAppFonts";

// Expo Router usa este nombre para mostrar una pantalla de error con "Reintentar".
export { ErrorFallback as ErrorBoundary };

/** Raíz de la app: gestos, tema, sesión y datos; recién con las fuentes cargadas se muestran las pantallas. */
export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot>
            <StatusBar style="auto" />
            <NavigationThemeBridge>
              <AppProviders>{fontsLoaded ? <RootNavigator /> : <SplashScreen />}</AppProviders>
            </NavigationThemeBridge>
          </ThemedRoot>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
