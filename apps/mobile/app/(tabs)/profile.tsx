import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { LocationConsentModal } from "@/components/LocationConsentModal";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePlaces } from "@/lib/places/PlacesContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { places } = usePlaces();
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Text style={styles.sectionTitle}>Lugares</Text>
        <AnimatedPressable
          accessibilityLabel="Mis lugares guardados"
          haptic={false}
          onPress={() => router.push("/places")}
          style={styles.row}
        >
          <Text style={styles.rowLabel}>Mis lugares</Text>
          <Text style={styles.rowValue}>{places.length} guardados →</Text>
        </AnimatedPressable>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Privacidad y datos</Text>
        <AnimatedPressable
          accessibilityLabel="Permisos de ubicación"
          haptic={false}
          onPress={() => setLocationModalVisible(true)}
          style={styles.row}
        >
          <Text style={styles.rowLabel}>Ubicación</Text>
          <Text style={styles.rowValue}>Gestionar →</Text>
        </AnimatedPressable>
        <Text style={styles.rowHint}>
          Descargar datos, corregir mis datos y eliminar cuenta llegan en una fase
          siguiente (Fase 19).
        </Text>

        <AnimatedPressable
          accessibilityLabel="Cerrar sesión"
          onPress={() => void logout()}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutLabel}>Cerrar sesión</Text>
        </AnimatedPressable>
      </View>

      <LocationConsentModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: typography.title.fontSize,
    color: colors.text.primary,
  },
  email: {
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.muted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  rowLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "500",
    fontSize: 15,
    color: colors.text.primary,
  },
  rowValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.brand.route,
  },
  rowHint: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.xxxl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.state.error,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  logoutLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.state.error,
  },
});
