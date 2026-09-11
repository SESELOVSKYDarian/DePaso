import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@depaso/design-tokens";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { PlacesProvider } from "@/lib/places/PlacesContext";
import { TodayRouteProvider } from "@/lib/routeContext/TodayRouteContext";
import { ToastProvider } from "@/components/Toast";

/**
 * Puerta de navegación por estado de auth (sección 4-5 del roadmap). `Stack.Protected`
 * decide qué grupo de rutas es alcanzable — no hay que navegar manualmente al arrancar,
 * el guard se encarga (si `onboardingSeen` pasa a true, expo-router saca "onboarding" del
 * árbol solo y cae al siguiente protegido que sí matchea).
 */
function RootNavigator() {
  const { isBootstrapping, onboardingSeen, isAuthenticated } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.splash}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.base },
      }}
    >
      <Stack.Protected guard={!onboardingSeen}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={onboardingSeen && !isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={onboardingSeen && isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="places/index"
          options={{ headerShown: true, title: "Mis lugares" }}
        />
        <Stack.Screen
          name="places/form"
          options={{ headerShown: true, title: "Lugar", presentation: "modal" }}
        />
        <Stack.Screen
          name="route-context/index"
          options={{ headerShown: true, title: "¿Por dónde vas a andar hoy?" }}
        />
      </Stack.Protected>
      <Stack.Screen name="legal/terms" options={{ headerShown: true, title: "Términos" }} />
      <Stack.Screen name="legal/privacy" options={{ headerShown: true, title: "Privacidad" }} />
      <Stack.Screen
        name="legal/community"
        options={{ headerShown: true, title: "Normas de la comunidad" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <PlacesProvider>
            <TodayRouteProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </TodayRouteProvider>
          </PlacesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface.base,
  },
  splashLogo: {
    width: 96,
    height: 96,
  },
});
