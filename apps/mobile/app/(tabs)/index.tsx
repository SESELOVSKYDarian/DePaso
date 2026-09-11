import { router } from "expo-router";
import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useToast } from "@/components/Toast";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Home (sección 73): no es un catálogo, arranca en "¿Qué necesitás comprar?" y prioriza
 * acción. El contexto de ruta ahora es real (Fase 7) — la lista de compra en sí sigue
 * siendo Fase 9, y "Encontrar mi mejor compra" (Fase 15-16, el motor ya existe en
 * @depaso/optimization/apps/api pero necesita catálogo/precios reales, Fase 8/12).
 */
export default function HomeScreen() {
  const { waypoints } = useTodayRoute();
  const { show: showToast } = useToast();

  const handleFindBestPurchase = () => {
    if (waypoints.length === 0) {
      router.push("/route-context");
      return;
    }
    showToast("El motor de optimización ya funciona — falta conectar catálogo y precios reales (Fase 8/12).", "info");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.greeting}>{greeting()} 👋</Text>
        <Text style={styles.question}>¿Qué necesitás comprar?</Text>

        <AnimatedPressable
          accessibilityLabel="Crear una lista nueva"
          onPress={() => showToast("Listas llega en la Fase 9.", "info")}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonLabel}>Crear una lista</Text>
        </AnimatedPressable>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>¿Dónde vas a estar hoy?</Text>

        <AnimatedPressable
          accessibilityLabel="Elegir por dónde vas a andar hoy"
          haptic={false}
          onPress={() => router.push("/route-context")}
          style={styles.routeCard}
        >
          {waypoints.length === 0 ? (
            <Text style={styles.routeEmptyLabel}>+ Elegir tu recorrido de hoy</Text>
          ) : (
            <View style={styles.chipsRow}>
              {waypoints.map((w, i) => (
                <Fragment key={w.key}>
                  {i > 0 ? <Text style={styles.chipArrow}>→</Text> : null}
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel} numberOfLines={1}>
                      {w.emoji} {w.name}
                    </Text>
                  </View>
                </Fragment>
              ))}
            </View>
          )}
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityLabel="Encontrar mi mejor compra"
          onPress={handleFindBestPurchase}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonLabel}>Encontrar mi mejor compra</Text>
        </AnimatedPressable>
      </View>
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
  greeting: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  question: {
    fontFamily: typography.display.fontFamily,
    fontSize: 28,
    color: colors.text.primary,
    marginTop: spacing.xxs,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.brand.navy,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  primaryButtonLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: 16,
    color: colors.text.onNavy,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "600",
    fontSize: typography.title.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  routeCard: {
    minHeight: 44,
    justifyContent: "center",
  },
  routeEmptyLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "600",
    fontSize: 15,
    color: colors.brand.route,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.brand.mint,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    maxWidth: 180,
  },
  chipLabel: {
    fontFamily: typography.body.fontFamily,
    fontWeight: "500",
    fontSize: 14,
    color: colors.text.primary,
  },
  chipArrow: {
    color: colors.text.muted,
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.saving.lime,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  secondaryButtonLabel: {
    fontFamily: typography.title.fontFamily,
    fontWeight: "700",
    fontSize: 16,
    color: colors.text.onLime,
  },
});
