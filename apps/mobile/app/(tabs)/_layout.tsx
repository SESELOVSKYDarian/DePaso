import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors, typography } from "@depaso/design-tokens";

/**
 * Bottom navigation (sección 72 del master prompt): Inicio / Listas / Mapa / Actividad /
 * Perfil. Cada pantalla es un placeholder por ahora — el contenido real de cada tab es
 * trabajo de las fases 6-19 (ver docs/development/IMPLEMENTATION-PLAN.md).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Listas",
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Actividad",
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
