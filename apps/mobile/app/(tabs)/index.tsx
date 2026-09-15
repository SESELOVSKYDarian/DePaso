import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Fragment } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

/** Stagger sutil de entrada (MOTION-SYSTEM.md, "Entrada de Home") — respeta Reduce Motion. */
function useEntering(index: number) {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? undefined : FadeInDown.delay(index * 70).duration(240);
}

/**
 * Home (depaso-inicio en Figma, sección 73 del master prompt): no es un catálogo, arranca
 * en "¿Qué vamos a hacer hoy?" y prioriza acción. El banner de ahorro de Figma mostraba un
 * monto fijo ("Hoy podés ahorrar hasta $3.250") — acá se deja el mismo look (tarjeta verde
 * con ícono + chevron) pero sin un número inventado, porque hasta no correr una
 * optimización real no hay un ahorro real que mostrar (sección "no mostrar ahorros
 * inventados", confirmado por el propio flujo de prueba de usuario).
 *
 * Catálogo/precios reales (Fase 8/12, SEPA) y Listas (Fase 9) ya están conectados — lo que
 * falta es la UI del Top 3 (Fase 16: elegir lista, llamar a `/api/optimize`, revelar los 3
 * planes con el "por qué") y el mapa/modo compra que vienen después (Fase 17/18). Por eso
 * el botón sigue avisando en vez de fingir un resultado — encontrado real probando el
 * flujo completo de usuario (35 pasos, "Encontrar mi mejor compra" en Home).
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const { waypoints } = useTodayRoute();

  const firstName = user?.displayName?.split(" ")[0] ?? "";

  const handleFindBestPurchase = () => {
    if (waypoints.length < 2) {
      router.push("/route-context");
      return;
    }
    router.push("/optimization");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={useEntering(0)} style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>¡Hola{firstName ? `, ${firstName}` : ""}! 👋</Text>
            <Text style={styles.question}>¿Qué vamos a hacer hoy?</Text>
          </View>
          <View style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
          </View>
        </Animated.View>

        <Animated.View entering={useEntering(1)}>
          <AnimatedPressable
            accessibilityLabel="Elegir por dónde vas a andar hoy"
            haptic={false}
            onPress={() => router.push("/route-context")}
            style={styles.routeCard}
          >
            <View style={styles.routeCardHeader}>
              <Text style={styles.routeCardTitle}>Tu ruta de hoy</Text>
              <Text style={styles.editLink}>Editar</Text>
            </View>
            {waypoints.length === 0 ? (
              <Text style={styles.routeEmptyLabel}>+ Elegir tu recorrido de hoy</Text>
            ) : (
              <>
                <View style={styles.chipsRow}>
                  {waypoints.map((w, i) => (
                    <Fragment key={w.key}>
                      {i > 0 ? (
                        <View style={styles.chipArrowWrap}>
                          <Ionicons name="arrow-forward" size={14} color={colors.text.secondary} />
                        </View>
                      ) : null}
                      <View style={styles.pinBadge}>
                        <Text style={styles.pinEmoji}>{w.emoji}</Text>
                      </View>
                      <Text style={styles.chipLabel} numberOfLines={1}>
                        {w.name}
                      </Text>
                    </Fragment>
                  ))}
                </View>
                <Text style={styles.routeMeta}>
                  {waypoints.length} {waypoints.length === 1 ? "parada" : "paradas"}
                </Text>
              </>
            )}
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={useEntering(2)}>
          <AnimatedPressable accessibilityLabel="Encontrar mi mejor compra" onPress={handleFindBestPurchase} style={styles.findCard}>
            <View style={styles.findCardText}>
              <Text style={styles.findCardTitle}>Encontrar mi mejor compra</Text>
              <Text style={styles.findCardSubtitle}>Comparamos precios y optimizamos tu ruta de hoy.</Text>
            </View>
            <Image
              source={require("../../assets/images/encontramejorcompra.png")}
              style={styles.findCardIllustration}
              resizeMode="contain"
            />
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={useEntering(3)} style={styles.savingsBanner}>
          <View style={styles.savingsIcon}>
            <Ionicons name="trending-up" size={18} color={colors.brand.accentDark} />
          </View>
          <Text style={styles.savingsLabel}>Descubrí cuánto podés ahorrar comprando de paso</Text>
          <View style={styles.savingsChevron}>
            <Ionicons name="chevron-forward" size={14} color={colors.text.onLime} />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 26,
    color: colors.text.primary,
  },
  question: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  routeCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md + 2,
    gap: spacing.xs,
  },
  routeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeCardTitle: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 14,
    color: colors.text.primary,
  },
  editLink: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
    textDecorationLine: "underline",
  },
  routeEmptyLabel: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: "underline",
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.tint.blue.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  pinEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontFamily: typography.itemTitle.fontFamily,
    fontSize: 15,
    color: colors.text.primary,
  },
  chipArrowWrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  routeMeta: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.text.secondary,
  },
  findCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.tint.blue.bg,
    borderWidth: 1,
    borderColor: colors.tint.blue.border,
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  findCardText: {
    flex: 1,
  },
  findCardTitle: {
    fontFamily: typography.heroTitle.fontFamily,
    fontSize: 20,
    color: colors.text.primary,
  },
  findCardSubtitle: {
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  findCardIllustration: {
    width: 90,
    height: 90,
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.tint.green.bg,
    borderWidth: 1,
    borderColor: colors.tint.green.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  savingsIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surface.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  savingsLabel: {
    flex: 1,
    fontFamily: typography.subtitle.fontFamily,
    fontSize: 13,
    color: colors.brand.accentDark,
  },
  savingsChevron: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    backgroundColor: colors.brand.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
