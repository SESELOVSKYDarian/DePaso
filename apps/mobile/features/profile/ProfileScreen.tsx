import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography } from "@depaso/design-tokens";
import { GroupedList, GroupedRow } from "@/components/common/GroupedList";
import { useNotificationInbox } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { useDetour } from "@/lib/detour/DetourContext";
import { usePlaces } from "@/lib/places/PlacesContext";
import { makeStyles, useTheme } from "@/lib/theme";
import { RoleSection } from "./components/RoleSection";
import { UserCard } from "./components/UserCard";
import { useProfileData } from "./useProfileData";

const THEME_LABEL = { system: "Automático", dark: "Oscuro", light: "Claro" } as const;

/**
 * Perfil: los datos de la cuenta y las filas de configuración agrupadas por tema. La sección del
 * medio cambia según el rol (administración, comercio o pedir ser comercio).
 */
export default function ProfileScreen() {
  const styles = useStyles();
  const { user, logout } = useAuth();
  const { mode } = useTheme();
  const { places } = usePlaces();
  const { strictBlocks, intermediateBlocks } = useDetour();
  const { unreadCount, clear: clearNotifications } = useNotificationInbox();
  const { productPreferenceCount, pendingMerchantRequests, syncPromos } = useProfileData();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>
          Mi perfil
        </Text>

        <UserCard name={user?.displayName ?? null} email={user?.email ?? ""} />

        <GroupedList title="Mis preferencias">
          <GroupedRow
            icon="pricetag-outline"
            label="Marcas y comercios"
            value={`${productPreferenceCount} ${productPreferenceCount === 1 ? "producto" : "productos"}`}
            onPress={() => router.push("/preferences")}
          />
          <GroupedRow
            icon="location-outline"
            label="Lugares guardados"
            value={`${places.length} ${places.length === 1 ? "lugar" : "lugares"}`}
            onPress={() => router.push("/places")}
          />
          <GroupedRow
            icon="trending-up-outline"
            label="Cuánto me desvío"
            value={`${strictBlocks} y ${intermediateBlocks} cuadras`}
            onPress={() => router.push("/detour")}
          />
          <GroupedRow icon="card-outline" label="Métodos de pago" onPress={() => router.push("/payment-methods")} />
        </GroupedList>

        <RoleSection role={user?.role} pendingMerchantRequests={pendingMerchantRequests} onSyncPromos={syncPromos} />

        <GroupedList title="Configuración">
          <GroupedRow icon="contrast-outline" label="Apariencia" value={THEME_LABEL[mode]} onPress={() => router.push("/appearance")} />
          <GroupedRow
            icon="notifications-outline"
            label="Notificaciones"
            {...(unreadCount > 0 ? { value: `${unreadCount} sin leer` } : {})}
            onPress={() => router.push("/notifications")}
          />
          <GroupedRow icon="lock-closed-outline" label="Privacidad y datos" onPress={() => router.push("/privacy")} />
          <GroupedRow icon="book-outline" label="Cómo usar DePaso" onPress={() => router.push("/how-to")} />
          <GroupedRow icon="help-circle-outline" label="Ayuda" onPress={() => router.push("/help")} />
        </GroupedList>

        <GroupedList>
          <GroupedRow
            icon="log-out-outline"
            label="Cerrar sesión"
            tone="accent"
            trailing={<View />}
            onPress={() => {
              clearNotifications();
              void logout();
            }}
          />
        </GroupedList>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 28, lineHeight: 34, color: colors.text.primary },
  }),
);
