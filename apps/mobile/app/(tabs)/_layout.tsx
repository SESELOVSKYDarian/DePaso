import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { typography } from "@depaso/design-tokens";
import { useBreakpoint } from "@/lib/responsive/useBreakpoint";
import { useColors } from "@/lib/theme";

/**
 * Bottom navigation (sección 72 del master prompt): Inicio / Listas / Mapa / Actividad /
 * Perfil. Cada pantalla es un placeholder por ahora — el contenido real de cada tab es
 * trabajo de las fases 6-19 (ver docs/development/IMPLEMENTATION-PLAN.md).
 */
export default function TabsLayout() {
  const colors = useColors();
  // En escritorio el menú pasa a la izquierda; en celu y tablet queda abajo.
  const { isDesktop } = useBreakpoint();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isDesktop ? "left" : "bottom",
        // Las pestañas son pares, no una jerarquía: un fundido corto, nunca un deslizamiento.
        animation: "fade",
        // Fondo del tema detrás de cada pestaña: sin esto el fundido pasaba por blanco.
        sceneStyle: { backgroundColor: colors.surface.base },
        tabBarActiveTintColor: colors.brand.accentDark,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface.primary,
          borderTopColor: colors.border.subtle,
        },
        tabBarLabelStyle: {
          fontFamily: typography.body.fontFamily,
          fontSize: 11,
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
  );
}
