import { Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from "@expo-google-fonts/montserrat";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@depaso/design-tokens";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { ListsProvider } from "@/lib/lists/ListsContext";
import { PlacesProvider } from "@/lib/places/PlacesContext";
import { TodayRouteProvider } from "@/lib/routeContext/TodayRouteContext";
import { ToastProvider } from "@/components/Toast";
import { PurchaseProvider } from "@/lib/purchase/PurchaseContext";

/**
 * Puerta de navegación por estado de auth (sección 4-5 del roadmap). `Stack.Protected`
 * decide qué grupo de rutas es alcanzable — no hay que navegar manualmente al arrancar,
 * el guard se encarga (si `onboardingSeen` pasa a true, expo-router saca "onboarding" del
 * árbol solo y cae al siguiente protegido que sí matchea).
 */
function RootNavigator() {
  const { isBootstrapping, onboardingSeen, isAuthenticated, postSignupDone } = useAuth();

  if (isBootstrapping) {
    return <SplashScreen />;
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
      <Stack.Protected guard={onboardingSeen && isAuthenticated && !postSignupDone}>
        <Stack.Screen name="(setup)" />
        {/* Ni `places/index` ni `places/form` (la copia del stack raíz) van acá.
            `(setup)/places.tsx` usa su propia ruta interna `(setup)/places-form` (alias de
            `places/form`, mismo componente) en vez de compartir nombre de `Stack.Screen`
            con el de abajo — registrar la MISMA `name` en dos `Stack.Protected` hermanos
            rompe la resolución de `router.push` (bug real: "route not handled by any
            navigator", encontrado probando "Mis lugares" con la app corriendo; un intento
            anterior de esto mismo sólo tapó el síntoma de aterrizar en la pantalla
            equivocada después del setup, sin notar que además rompía la navegación). */}
      </Stack.Protected>
      <Stack.Protected guard={onboardingSeen && isAuthenticated && postSignupDone}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="places/index"
          options={{ headerShown: true, title: "Mis lugares" }}
        />
        <Stack.Screen
          name="places/form"
          options={{ headerShown: true, title: "Lugar", presentation: "modal" }}
        />
        <Stack.Screen name="route-context/index" options={{ headerShown: false }} />
        <Stack.Screen name="optimization/index" options={{ headerShown: false }} />
        <Stack.Screen name="purchase/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="report-price"
          options={{ headerShown: true, title: "Reportar precio", presentation: "modal" }}
        />
        <Stack.Screen
          name="lists/[id]"
          options={{ headerShown: true, title: "Lista" }}
        />
        <Stack.Screen
          name="lists/form"
          options={{ headerShown: true, title: "Nueva lista", presentation: "modal" }}
        />
        <Stack.Screen
          name="lists/search"
          options={{ headerShown: true, title: "Agregar producto", presentation: "modal" }}
        />
        <Stack.Screen
          name="preferences/index"
          options={{ headerShown: true, title: "Mis preferencias" }}
        />
        <Stack.Screen
          name="preferences/product-form"
          options={{ headerShown: true, title: "Preferencia de marca", presentation: "modal" }}
        />
        <Stack.Screen
          name="preferences/store-form"
          options={{ headerShown: true, title: "Preferencia de comercio", presentation: "modal" }}
        />
        <Stack.Screen
          name="privacy/index"
          options={{ headerShown: true, title: "Privacidad y datos" }}
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

/**
 * Fuentes reales de marca (branding/DePaso_Tipografia_Logo.md): Fredoka para titulares/CTAs
 * de marca, Montserrat para el resto de la UI. Sin esto, `typography.ts` declara los
 * nombres pero React Native cae a la fuente del sistema — se ve "distinto a Figma" aunque
 * el resto del diseño esté bien.
 */
function useAppFonts() {
  return useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });
}

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <PlacesProvider>
            <ListsProvider>
              <TodayRouteProvider>
                <PurchaseProvider><ToastProvider>
                  {fontsLoaded ? <RootNavigator /> : <SplashScreen />}
                </ToastProvider></PurchaseProvider>
              </TodayRouteProvider>
            </ListsProvider>
          </PlacesProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
