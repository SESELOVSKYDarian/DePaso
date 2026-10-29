import { Stack } from "expo-router";
import { Platform } from "react-native";
import { typography } from "@depaso/design-tokens";
import { SplashScreen } from "@/components/common/SplashScreen";
import { useAuth } from "@/lib/auth/AuthContext";
import { sheet } from "@/lib/navigation/sheetOptions";
import { useColors } from "@/lib/theme";

/**
 * Puerta de navegación por estado de sesión. `Stack.Protected` decide qué grupo de rutas es
 * alcanzable: no hay que navegar a mano al arrancar, el guard se encarga (si `onboardingSeen`
 * pasa a true, expo-router saca "onboarding" del árbol solo y cae al siguiente grupo que sí
 * corresponde). Las pantallas van acá y no en componentes aparte porque expo-router solo las
 * reconoce como hijas directas del `Stack`.
 */
export function RootNavigator() {
  const colors = useColors();
  const { isBootstrapping, onboardingSeen, isAuthenticated, postSignupDone } = useAuth();

  if (isBootstrapping) return <SplashScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.base },
        // Encabezados con la tipografía y los colores de marca, sin la línea del sistema.
        headerStyle: { backgroundColor: colors.surface.base },
        headerShadowVisible: false,
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontFamily: typography.title.fontFamily, fontSize: 17 },
        headerBackButtonDisplayMode: "minimal",
        // Empujar = deslizar desde la derecha; volver con el gesto de borde (iOS: desde cualquier punto).
        animation: Platform.OS === "ios" ? "default" : "ios_from_right",
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      {/* 1. primera vez: bienvenida */}
      <Stack.Protected guard={!onboardingSeen}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      {/* 2. sin sesión: ingresar o registrarse */}
      <Stack.Protected guard={onboardingSeen && !isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* 3. recién registrado: ubicación, lugares y desvío. `(setup)/places.tsx` usa su propia ruta
          interna `(setup)/places-form`: registrar el MISMO nombre en dos grupos hermanos rompe
          `router.push` ("route not handled by any navigator"). */}
      <Stack.Protected guard={onboardingSeen && isAuthenticated && !postSignupDone}>
        <Stack.Screen name="(setup)" />
      </Stack.Protected>

      {/* 4. con sesión: la app */}
      <Stack.Protected guard={onboardingSeen && isAuthenticated && postSignupDone}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="places/index" options={{ headerShown: true, title: "Mis lugares" }} />
        <Stack.Screen name="places/form" options={{ headerShown: true, title: "Lugar", presentation: "modal" }} />

        {/* flujo de compra: elegir o armar el recorrido, optimizar y comprar */}
        <Stack.Screen name="route-context/index" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="route-builder/index" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="optimization/index" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="purchase/index" options={{ headerShown: false, animation: "fade_from_bottom" }} />
        <Stack.Screen name="report-price" options={{ headerShown: true, title: "Reportar precio", ...sheet([0.75, 1]) }} />

        {/* listas */}
        <Stack.Screen name="lists/[id]" options={{ headerShown: true, title: "Lista" }} />
        <Stack.Screen name="lists/form" options={{ headerShown: true, title: "Nueva lista", ...sheet([0.45, 1]) }} />
        <Stack.Screen name="lists/search" options={{ headerShown: true, title: "Agregar producto", presentation: "modal" }} />
        <Stack.Screen name="lists/assistant" options={{ headerShown: true, title: "Armar con IA", presentation: "modal" }} />

        {/* perfil y ajustes */}
        <Stack.Screen name="preferences/index" options={{ headerShown: true, title: "Mis preferencias" }} />
        <Stack.Screen name="preferences/product-form" options={{ headerShown: true, title: "Preferencia de marca", presentation: "modal" }} />
        <Stack.Screen name="preferences/store-form" options={{ headerShown: true, title: "Preferencia de comercio", presentation: "modal" }} />
        <Stack.Screen name="detour" options={{ headerShown: true, title: "Cuánto me desvío", ...sheet([0.5]) }} />
        <Stack.Screen name="payment-methods" options={{ headerShown: true, title: "Métodos de pago", ...sheet([0.75, 1]) }} />
        <Stack.Screen name="appearance" options={{ headerShown: true, title: "Apariencia", ...sheet([0.42]) }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notificaciones" }} />
        <Stack.Screen name="help" options={{ headerShown: true, title: "Ayuda" }} />
        <Stack.Screen name="privacy/index" options={{ headerShown: true, title: "Privacidad y datos" }} />

        {/* comercio y administración */}
        <Stack.Screen name="merchant/request" options={{ headerShown: true, title: "Quiero ser comercio" }} />
        <Stack.Screen name="merchant/index" options={{ headerShown: true, title: "Mi comercio" }} />
        <Stack.Screen name="merchant/price-form" options={{ headerShown: true, title: "Producto y precio", presentation: "modal" }} />
        <Stack.Screen name="admin/merchant-requests" options={{ headerShown: true, title: "Solicitudes de comercio" }} />
      </Stack.Protected>

      {/* textos legales: se pueden abrir con o sin sesión */}
      <Stack.Screen name="legal/terms" options={{ headerShown: true, title: "Términos" }} />
      <Stack.Screen name="legal/privacy" options={{ headerShown: true, title: "Privacidad" }} />
      <Stack.Screen name="legal/community" options={{ headerShown: true, title: "Normas de la comunidad" }} />
    </Stack>
  );
}
