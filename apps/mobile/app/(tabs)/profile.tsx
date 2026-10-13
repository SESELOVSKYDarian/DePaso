import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useTheme } from "@/lib/theme";
import { GroupedList, GroupedRow } from "@/components/GroupedList";
import { useNotificationInbox, useToast } from "@/components/Toast";
import { adminMerchantClient, paymentsClient, preferencesClient } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePlaces } from "@/lib/places/PlacesContext";

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return email[0]?.toUpperCase() ?? "?";
}

/**
 * Perfil (depaso-perfil en Figma). Las filas se agrupan por tema en un solo bloque cada una.
 * La sección según rol muestra lo que corresponde: administración, comercio o la opción de
 * pedir ser comercio.
 */
export default function ProfileScreen() {
  const styles = useStyles();
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const { mode } = useTheme();
  const { places } = usePlaces();
  const { show: showToast } = useToast();
  const { unreadCount, clear: clearNotifications } = useNotificationInbox();
  const [productPreferenceCount, setProductPreferenceCount] = useState(0);
  const [pendingMerchantRequests, setPendingMerchantRequests] = useState(0);
  const role = user?.role;

  useEffect(() => {
    if (!isAuthenticated) return;
    preferencesClient.products
      .list()
      .then(({ preferences }) => setProductPreferenceCount(preferences.length))
      .catch(() => setProductPreferenceCount(0));
  }, [isAuthenticated]);

  // Al volver a esta pestaña se refresca el rol (por si un admin aprobó la solicitud) y,
  // si es admin, el contador de solicitudes de comercio pendientes.
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      void refreshUser().catch(() => undefined);
      if (role === "ADMIN") {
        adminMerchantClient
          .list("PENDING")
          .then(({ pendingCount }) => setPendingMerchantRequests(pendingCount))
          .catch(() => setPendingMerchantRequests(0));
      }
    }, [isAuthenticated, role, refreshUser])
  );

  const handleSyncPromos = () => {
    showToast("Actualizando promos de bancos y billeteras...", "info");
    paymentsClient
      .syncPromos()
      .then(({ accepted, discarded }) =>
        showToast(`${accepted} promos válidas cargadas, ${discarded} descartadas.`, "success")
      )
      .catch(() => showToast("No pudimos actualizar las promos.", "error"));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>
          Mi perfil
        </Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initials(user?.displayName ?? null, user?.email ?? "")}</Text>
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.displayName ?? "Sin nombre"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

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
            icon="card-outline"
            label="Métodos de pago"
            onPress={() => router.push("/payment-methods")}
          />
        </GroupedList>

        {role === "ADMIN" ? (
          <GroupedList title="Administración">
            <GroupedRow
              icon="storefront-outline"
              label="Solicitudes de comercio"
              {...(pendingMerchantRequests > 0 ? { value: `${pendingMerchantRequests} pendientes` } : {})}
              onPress={() => router.push("/admin/merchant-requests")}
            />
            <GroupedRow
              icon="pricetags-outline"
              label="Actualizar promos de bancos y billeteras"
              onPress={handleSyncPromos}
            />
          </GroupedList>
        ) : null}

        {role === "MERCHANT" ? (
          <GroupedList title="Mi comercio">
            <GroupedRow
              icon="storefront-outline"
              label="Mis productos y precios"
              onPress={() => router.push("/merchant")}
            />
          </GroupedList>
        ) : null}

        {role === "USER" ? (
          <GroupedList title="Comercios">
            <GroupedRow
              icon="storefront-outline"
              label="Quiero ser comercio"
              onPress={() => router.push("/merchant/request")}
            />
          </GroupedList>
        ) : null}

        <GroupedList title="Configuración">
          <GroupedRow
            icon="contrast-outline"
            label="Apariencia"
            value={mode === "system" ? "Automático" : mode === "dark" ? "Oscuro" : "Claro"}
            onPress={() => router.push("/appearance")}
          />
          <GroupedRow
            icon="notifications-outline"
            label="Notificaciones"
            {...(unreadCount > 0 ? { value: `${unreadCount} sin leer` } : {})}
            onPress={() => router.push("/notifications")}
          />
          <GroupedRow icon="lock-closed-outline" label="Privacidad y datos" onPress={() => router.push("/privacy")} />
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

const useStyles = makeStyles((colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.primary,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.brand.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 20,
    color: colors.text.onNavy,
  },
  userText: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 19,
    lineHeight: 24,
    color: colors.text.primary,
  },
  userEmail: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
}));
