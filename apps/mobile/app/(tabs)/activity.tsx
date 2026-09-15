import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";

/**
 * Actividad (depaso-actividad en Figma). No hay historial real todavía (Fases 13/16/18:
 * reportes de precio, resultado de una optimización, ahorro de una compra — ninguno
 * persistido ni expuesto por `@depaso/validation`). Antes mostraba un feed y un total
 * ahorrado hardcodeados sin ninguna marca de que eran de muestra — encontrado real
 * probando el flujo completo de usuario, contradice el mismo criterio que ya se sigue en
 * Home ("no mostrar ahorros inventados") y en la pestaña "Comunidad" de al lado, que sí
 * usa un `EmptyState` honesto. Corregido para ser consistente.
 */
export default function ActivityScreen() {
  const [tab, setTab] = useState<"mine" | "community">("mine");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Tu actividad</Text>

      <View style={styles.tabs}>
        <AnimatedPressable
          accessibilityLabel="Actividad"
          haptic={false}
          onPress={() => setTab("mine")}
          style={[styles.tabButton, tab === "mine" ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabLabel, tab === "mine" ? styles.tabLabelActive : null]}>Actividad</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Comunidad"
          haptic={false}
          onPress={() => setTab("community")}
          style={[styles.tabButton, tab === "community" ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabLabel, tab === "community" ? styles.tabLabelActive : null]}>Comunidad</Text>
        </AnimatedPressable>
      </View>

      {tab === "community" ? (
        <EmptyState emoji="🌎" title="Actividad de la comunidad" description="Ver aportes de otras personas cerca tuyo llega en una fase siguiente." />
      ) : (
        <EmptyState
          emoji="🧾"
          title="Todavía no tenés actividad"
          description="Cuando completes una compra o reportes un precio, va a aparecer acá — con datos reales, no una muestra."
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  title: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 24,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  tabButtonActive: {
    backgroundColor: colors.brand.navy,
  },
  tabLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: colors.text.onNavy,
  },
});
