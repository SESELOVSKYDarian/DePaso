import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActivitySummary } from "@/lib/activity/useActivitySummary";
import { StartupExtras } from "@/features/announcement-popup/StartupExtras";
import { typography } from "@depaso/design-tokens";
import { SIDE_NAV_WIDTH, useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { useColors } from "@/lib/theme";

/**
 * Menú principal: Inicio / Listas / Mapa / Actividad / Perfil. Abajo en el celular vertical,
 * a la izquierda en pantallas grandes y con el celular acostado.
 */
export default function TabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { summary } = useActivitySummary();
  // En pantallas grandes y con el celular acostado el menú pasa a la izquierda, como una barra
  // lateral; en vertical queda abajo.
  const { hasSideNav, isDesktop } = useBreakpoint();
  return (
    <>
    <StartupExtras />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: hasSideNav ? "left" : "bottom",
        // escritorio: ícono con el texto al lado; celular acostado: una barra angosta solo de íconos
        tabBarVariant: hasSideNav ? "material" : "uikit",
        tabBarShowLabel: !hasSideNav || isDesktop,
        // Las pestañas son pares, no una jerarquía: un fundido corto, nunca un deslizamiento.
        animation: "fade",
        // Fondo del tema detrás de cada pestaña: sin esto el fundido pasaba por blanco.
        sceneStyle: { backgroundColor: colors.surface.base },
        tabBarActiveTintColor: colors.brand.accentDark,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: hasSideNav
          ? {
              backgroundColor: colors.surface.primary,
              borderRightColor: colors.border.subtle,
              borderRightWidth: 1,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              paddingHorizontal: isDesktop ? 12 : 4,
              // el menú lateral trae un ancho mínimo de 360: se lo baja al que corresponde
              width: isDesktop ? SIDE_NAV_WIDTH : 76,
              minWidth: isDesktop ? SIDE_NAV_WIDTH : 76,
            }
          : {
              backgroundColor: colors.surface.primary,
              borderTopColor: colors.border.subtle,
              // alto fijo + la barra del sistema (botones o gestos de Android): sin esto la tapa
              height: 62 + insets.bottom,
              paddingTop: 6,
              paddingBottom: 6 + insets.bottom,
            },
        tabBarLabelStyle: {
          fontFamily: typography.body.fontFamily,
          fontSize: 11,
          lineHeight: 15,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Listas",
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Actividad",
          // numerito con lo que espera una respuesta (pedidos del admin, contraofertas del comercio)
          ...(summary.badge > 0 ? { tabBarBadge: summary.badge > 99 ? "99+" : summary.badge } : {}),
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color as string} size={size} />,
        }}
      />
    </Tabs>
    </>
  );
}
