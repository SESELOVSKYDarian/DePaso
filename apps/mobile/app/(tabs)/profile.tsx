import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useToast } from "@/components/Toast";
import { preferencesClient } from "@/lib/apiClient";
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

/** Perfil (depaso-perfil en Figma). "Métodos de pago" no tiene backend (no hay concepto de
 * medio de pago en el schema) — queda con el mismo patrón de toast que `SocialButton`, sin
 * un conteo inventado (antes decía "2 tarjetas" fijo — encontrado real probando el flujo
 * completo, mismo criterio que la corrección de `activity.tsx`). "Mis lugares guardados",
 * "Mis marcas y comercios preferidos" (Fase 10) y "Cerrar sesión" sí son reales. */
export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { places } = usePlaces();
  const { show: showToast } = useToast();
  const [productPreferenceCount, setProductPreferenceCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    preferencesClient.products
      .list()
      .then(({ preferences }) => setProductPreferenceCount(preferences.length))
      .catch(() => setProductPreferenceCount(0));
  }, [isAuthenticated]);

  const notReady = (label: string) => showToast(`${label} todavía no está disponible.`, "info");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mi perfil</Text>
          <AnimatedPressable accessibilityLabel="Configuración" haptic={false} onPress={() => notReady("Configuración")} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
          </AnimatedPressable>
        </View>

        <AnimatedPressable accessibilityLabel="Editar perfil" haptic={false} onPress={() => notReady("Editar perfil")} style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initials(user?.displayName ?? null, user?.email ?? "")}</Text>
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{user?.displayName ?? "Sin nombre"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
        </AnimatedPressable>

        <Text style={styles.sectionTitle}>Mis preferencias</Text>
        <View style={styles.section}>
          <ProfileRow
            icon="pricetag-outline"
            label="Mis marcas y comercios preferidos"
            value={`${productPreferenceCount} ${productPreferenceCount === 1 ? "producto" : "productos"}`}
            onPress={() => router.push("/preferences")}
          />
          <ProfileRow
            icon="location-outline"
            label="Mis lugares guardados"
            value={`${places.length} ${places.length === 1 ? "lugar" : "lugares"}`}
            onPress={() => router.push("/places")}
          />
          <ProfileRow
            icon="card-outline"
            label="Métodos de pago"
            onPress={() => notReady("Métodos de pago")}
          />
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Configuración</Text>
        <View style={styles.section}>
          <ProfileRow icon="notifications-outline" label="Notificaciones" onPress={() => notReady("Notificaciones")} />
          <ProfileRow icon="lock-closed-outline" label="Privacidad y datos" onPress={() => router.push("/privacy")} />
          <ProfileRow icon="help-circle-outline" label="Ayuda y soporte" onPress={() => notReady("Ayuda y soporte")} />
          <ProfileRow
            icon="log-out-outline"
            label="Cerrar sesión"
            labelColor={colors.brand.accentDark}
            onPress={() => void logout()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  label,
  labelColor,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  labelColor?: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable accessibilityLabel={label} haptic={false} onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={18} color={labelColor ?? colors.text.secondary} />
      <Text style={[styles.rowLabel, labelColor ? { color: labelColor } : null]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 28,
    color: colors.text.primary,
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    backgroundColor: colors.brand.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 18,
    color: colors.text.onNavy,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 18,
    color: colors.text.primary,
  },
  userEmail: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 1,
  },
  sectionTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSpacing: {
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  rowLabel: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  rowValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    color: colors.text.secondary,
  },
});
