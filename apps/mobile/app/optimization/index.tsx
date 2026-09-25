import { Ionicons } from "@expo/vector-icons";
import type { OptimizationPlanResponse } from "@depaso/validation";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Button } from "@/components/Button";
import { PriceDisclosureBanner } from "@/components/PriceDisclosureBanner";
import { optimizationClient } from "@/lib/apiClient";
import { useCountUp } from "@/lib/useCountUp";
import { useLists } from "@/lib/lists/ListsContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";
import { usePurchase } from "@/lib/purchase/PurchaseContext";

const labels = {
  BALANCED: { title: "Mejor equilibrio", subtitle: "Ahorro y tiempo en balance", icon: "sparkles-outline" as const },
  FASTEST: { title: "Más rápido", subtitle: "El menor desvío posible", icon: "flash-outline" as const },
  CHEAPEST: { title: "Más económico", subtitle: "El menor costo de productos", icon: "wallet-outline" as const },
};
const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const distance = (meters: number) => meters < 1000 ? `${Math.round(meters)} m extra` : `${(meters / 1000).toFixed(1)} km extra`;

/** MOTION-SYSTEM.md, "Animación de optimización" — pulso sutil en vez de un spinner mudo;
 * comunica "sigo trabajando", no decorativo (principio 5). Respeta Reduce Motion. */
function AnalyzingIndicator() {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withRepeat(withSequence(withTiming(0.45, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
  }, [reducedMotion, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: reducedMotion ? 1 : opacity.value }));
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={[styles.analyzing, animatedStyle]}>
      <Ionicons name="sparkles-outline" size={16} color={colors.brand.accentDark} />
      <Text style={styles.analyzingText}>Analizando productos y precios cercanos...</Text>
    </Animated.View>
  );
}

function PlanCard({ plan, index, onStart }: { plan: OptimizationPlanResponse; index: number; onStart: () => void }) {
  const reducedMotion = useReducedMotion();
  const meta = labels[plan.label];
  const recommended = plan.label === "BALANCED";
  const animatedSavings = useCountUp(plan.estimatedSavings, 500);
  return <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(index * 110).duration(280)} style={[styles.plan, recommended && styles.recommended]}>
    <View style={styles.planHead}>
      <View style={[styles.planIcon, recommended && styles.recommendedIcon]} accessible={false}><Ionicons name={meta.icon} size={21} color={colors.text.primary} /></View>
      <View style={styles.flex}><View style={styles.titleLine}><Text style={styles.planTitle}>{meta.title}</Text>{recommended ? <Text style={styles.tag}>RECOMENDADO</Text> : null}</View><Text style={styles.meta}>{meta.subtitle}</Text></View>
    </View>
    <View style={styles.costRow}><View><Text style={styles.meta}>Costo estimado</Text><Text style={styles.cost}>{money(plan.totalProductCost)}</Text></View>{plan.estimatedSavings > 0 ? <View style={styles.savings}><Text style={styles.savingsText}>Ahorrás {money(animatedSavings)}</Text></View> : null}</View>
    <Text style={styles.meta}>{plan.numberOfStops} {plan.numberOfStops === 1 ? "comercio" : "comercios"}  ·  {distance(plan.additionalDistanceMeters)}  ·  {Math.ceil(plan.additionalTimeSeconds / 60)} min</Text>
    {plan.appliedPromos.map((promo) => <View key={`${promo.retailer}-${promo.label}`} style={promoStyles.box}><Text style={promoStyles.title}>{promo.retailer}: {promo.label}</Text><Text style={promoStyles.text}>Descuento {money(promo.discountAmount)}. {promo.disclaimer}</Text></View>)}
    <Text style={styles.explanation}>{plan.explanation}</Text>
    {plan.missingProductIds.length > 0 ? <Text style={styles.warning}>Hay {plan.missingProductIds.length} producto{plan.missingProductIds.length === 1 ? "" : "s"} sin precio vigente.</Text> : null}
    <AnimatedPressable accessibilityLabel={`Empezar compra con ${meta.title}`} onPress={onStart} style={styles.routeAction}><Text style={styles.routeActionText}>Empezar compra</Text><Ionicons name="arrow-forward" size={17} color={colors.text.primary} accessible={false} /></AnimatedPressable>
  </Animated.View>;
}

/** Fase 16: Top 3 construido desde la lista, preferencias, precios y sucursales reales. */
export default function OptimizationScreen() {
  const { lists, isLoading: loadingLists } = useLists();
  const { waypoints } = useTodayRoute();
  const { start } = usePurchase();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [plans, setPlans] = useState<OptimizationPlanResponse[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeLists = lists.filter((list) => !list.archivedAt && list.itemCount > 0);

  const run = async () => {
    if (!selectedListId || waypoints.length < 2) return;
    setError(null); setRunning(true);
    try {
      const result = await optimizationClient.run({ shoppingListId: selectedListId, routeContext: { waypoints: waypoints.map(({ latitude, longitude }) => ({ latitude, longitude })) }, transportMode: "CAR" });
      if (result.plans.length === 0) {
        // Respuesta real y válida (200, sin combinaciones viables) — no un error del
        // motor. Bug real encontrado probando el flujo completo: antes esto caía en el
        // mismo mensaje genérico que una falla real porque el schema rechazaba `[]`.
        setError("No encontramos comercios con estos productos cerca de tu recorrido de hoy. Probá con otra lista o ampliá tu ruta.");
        return;
      }
      setPlans(result.plans);
    } catch (caught) {
      const code = (caught as { body?: { error?: string } }).body?.error;
      setError(code === "NO_CURRENT_PRICES" ? "Todavía no encontramos precios vigentes para esta lista." : "No pudimos armar tu Top 3. Probá de nuevo en unos instantes.");
    } finally { setRunning(false); }
  };

  if (plans) return <SafeAreaView style={styles.container} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.resultsHead}><View><Text style={styles.eyebrow}>TU TOP 3</Text><Text style={styles.screenTitle}>Comprá mejor, de paso</Text></View><AnimatedPressable accessibilityLabel="Armar otra optimización" haptic={false} onPress={() => setPlans(null)} style={styles.reset}><Ionicons name="refresh" size={19} color={colors.text.primary} accessible={false} /></AnimatedPressable></View>
    <Text style={styles.intro}>Elegí la opción que mejor encaja con tu día. Los precios provienen de datos vigentes.</Text>
    <PriceDisclosureBanner />
    {plans.map((plan, index) => <PlanCard key={plan.label} plan={plan} index={index} onStart={() => { start(plan); router.push("/purchase"); }} />)}
  </ScrollView></SafeAreaView>;

  return <SafeAreaView style={styles.container} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>OPTIMIZAR COMPRA</Text><Text style={styles.screenTitle}>Encontrá tu mejor compra</Text><Text style={styles.intro}>Usamos tu recorrido, lista y preferencias para comparar precios reales sin hacerte salirte del camino.</Text>
    <View style={styles.section}><Text style={styles.sectionTitle}>1. Elegí una lista</Text>
      {loadingLists ? <ActivityIndicator color={colors.brand.navy} style={styles.loader} /> : null}
      {!loadingLists && activeLists.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>Necesitás una lista con al menos un producto para calcular opciones.</Text><Button label="Crear una lista" variant="secondary" onPress={() => router.push("/lists/form")} /></View> : null}
      {activeLists.map((list) => { const selected = list.id === selectedListId; return <AnimatedPressable key={list.id} accessibilityLabel={`Usar la lista ${list.name}`} onPress={() => setSelectedListId(list.id)} style={[styles.choice, selected && styles.choiceSelected]}><View style={styles.choiceIcon} accessible={false}><Ionicons name="list-outline" size={20} color={colors.brand.route} /></View><View style={styles.flex}><Text style={styles.choiceName}>{list.name}</Text><Text style={styles.meta}>{list.itemCount} {list.itemCount === 1 ? "producto" : "productos"}</Text></View><Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={22} color={selected ? colors.brand.accentDark : colors.text.secondary} accessible={false} /></AnimatedPressable>; })}
    </View>
    <View style={styles.section}><Text style={styles.sectionTitle}>2. Confirmá tu recorrido</Text><AnimatedPressable accessibilityLabel="Editar recorrido de hoy" haptic={false} onPress={() => router.push("/route-context")} style={styles.choice}><View style={styles.choiceIcon} accessible={false}><Ionicons name="navigate-outline" size={20} color={colors.brand.route} /></View><View style={styles.flex}><Text style={styles.choiceName}>{waypoints.length >= 2 ? `${waypoints[0]?.name ?? "Origen"} → ${waypoints[waypoints.length - 1]?.name ?? "Destino"}` : "Todavía no hay un recorrido completo"}</Text><Text style={styles.meta}>{waypoints.length >= 2 ? `${waypoints.length} paradas para hoy` : "Elegí al menos origen y destino"}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.text.secondary} accessible={false} /></AnimatedPressable></View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {running ? <AnalyzingIndicator /> : null}
    <Button label="Ver mi Top 3" loading={running} disabled={!selectedListId || waypoints.length < 2 || running} onPress={run} style={styles.runButton} />
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface.base }, content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md }, flex: { flex: 1 },
  eyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 12, letterSpacing: 1, color: colors.brand.accentDark }, screenTitle: { fontFamily: typography.heroTitle.fontFamily, fontSize: 28, lineHeight: 34, color: colors.text.primary }, intro: { fontFamily: typography.body.fontFamily, fontSize: 15, lineHeight: 22, color: colors.text.secondary },
  section: { gap: spacing.sm, marginTop: spacing.sm }, sectionTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary }, loader: { marginVertical: spacing.md },
  choice: { minHeight: 64, padding: spacing.sm, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: radii.lg, backgroundColor: colors.surface.primary, flexDirection: "row", alignItems: "center", gap: spacing.sm }, choiceSelected: { borderColor: colors.brand.accentDark, backgroundColor: colors.surface.secondary }, choiceIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.tint.blue.bg }, choiceName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary }, meta: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
  empty: { gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle }, emptyText: { fontFamily: typography.body.fontFamily, fontSize: 14, lineHeight: 20, color: colors.text.secondary }, error: { fontFamily: typography.body.fontFamily, fontSize: 14, color: colors.state.error }, runButton: { marginTop: spacing.md }, analyzing: { flexDirection: "row", alignItems: "center", gap: spacing.xs, justifyContent: "center", paddingVertical: spacing.xs }, analyzingText: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.brand.accentDark },
  resultsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, reset: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.surface.primary, borderWidth: 1, borderColor: colors.border.subtle }, plan: { gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface.primary, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border.subtle }, recommended: { borderColor: colors.saving.lime, borderWidth: 2 }, planHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm }, planIcon: { width: 42, height: 42, borderRadius: radii.md, backgroundColor: colors.tint.blue.bg, alignItems: "center", justifyContent: "center" }, recommendedIcon: { backgroundColor: colors.surface.secondary }, titleLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs }, planTitle: { fontFamily: typography.itemTitle.fontFamily, fontSize: 17, color: colors.text.primary }, tag: { fontFamily: typography.caption.fontFamily, fontSize: 10, color: colors.text.onLime, backgroundColor: colors.saving.lime, paddingHorizontal: 6, paddingVertical: 3, borderRadius: radii.full }, costRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, cost: { fontFamily: typography.heroTitle.fontFamily, fontSize: 24, color: colors.text.primary }, savings: { backgroundColor: colors.saving.lime, borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: 6 }, savingsText: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.onLime }, explanation: { fontFamily: typography.body.fontFamily, fontSize: 13, lineHeight: 19, color: colors.text.primary }, warning: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.state.warning }, routeAction: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: spacing.sm }, routeActionText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.text.primary },
});

const promoStyles = StyleSheet.create({
  box: { backgroundColor: colors.brand.mint, borderRadius: radii.md, padding: spacing.sm, gap: 2 },
  title: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 13, color: colors.text.primary },
  text: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary },
});