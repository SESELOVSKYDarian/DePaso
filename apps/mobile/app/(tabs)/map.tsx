import { Ionicons } from "@expo/vector-icons";
import type { NearbyStore, OptimizationPlanResponse } from "@depaso/validation";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { RouteMapView } from "@/components/RouteMapView";
import { mapConfigClient, routeComputeClient } from "@/lib/apiClient";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

/** Debajo de esto se considera que el comercio está sobre el camino. */
const RIGHT_ON_ROUTE_METERS = 120;

function formatDetour(store: NearbyStore): string {
  if (store.detourMeters < RIGHT_ON_ROUTE_METERS) return "Justo de paso";
  const minutes = Math.max(1, Math.round(store.detourSeconds / 60));
  const meters =
    store.detourMeters < 1000 ? `${Math.round(store.detourMeters / 10) * 10} m` : `${(store.detourMeters / 1000).toFixed(1)} km`;
  return `+${minutes} min · ${meters}`;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

/** Una cuadra en Argentina ronda los 100 m: "a 2 cuadras" se entiende mejor que "a 200 m". */
function formatBlocks(meters: number | undefined): string {
  if (meters === undefined) return "";
  const blocks = Math.round(meters / 100);
  if (blocks < 1) return "Sobre tu camino";
  return `A ${blocks} ${blocks === 1 ? "cuadra" : "cuadras"} de tu camino`;
}

function sameBase(plan: OptimizationPlanResponse, waypoints: { latitude: number; longitude: number }[]): boolean {
  const route = plan.routeWaypoints;
  if (!route) return false;
  const inserted = new Set(plan.stops.map((stop) => stop.routeIndex));
  const base = route.filter((_, index) => !inserted.has(index));
  return (
    base.length === waypoints.length &&
    base.every(
      (point, index) =>
        Math.abs(point.latitude - waypoints[index]!.latitude) < 1e-6 &&
        Math.abs(point.longitude - waypoints[index]!.longitude) < 1e-6,
    )
  );
}

/**
 * Mapa del recorrido de hoy: la ruta con sus paradas y, sobre ella, los comercios que te
 * quedan "de paso" con cuánto te desviás para pasar por cada uno. Mapbox GL JS real cuando
 * hay token configurado; si no, queda el orden de paradas y las direcciones.
 */
export default function MapScreen() {
  const s = useStyles();
  const colors = useColors();
  const { waypoints } = useTodayRoute();
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  // Mapa a pantalla completa: en el recuadro chico costaba moverse y tocar los comercios.
  const [fullMap, setFullMap] = useState(false);
  const { routePlan, start, routePlans, setRoutePlan } = usePurchase();
  const [planPolyline, setPlanPolyline] = useState<string | null>(null);

  // El plan sólo vale mientras el recorrido sea el mismo con el que se calculó: si lo editaste
  // (cambió el origen, el destino o una parada) hay que recalcular.
  const planIsCurrent = routePlan !== null && sameBase(routePlan, waypoints);
  const plan = planIsCurrent ? routePlan : null;

  useEffect(() => {
    if (!plan?.routeWaypoints || plan.routeWaypoints.length < 2) {
      setPlanPolyline(null);
      return;
    }
    let cancelled = false;
    routeComputeClient
      .compute({ waypoints: plan.routeWaypoints, transportMode: "CAR" })
      .then((route) => {
        if (!cancelled) setPlanPolyline(route.polyline);
      })
      .catch(() => {
        if (!cancelled) setPlanPolyline(null);
      });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  useEffect(() => {
    if (waypoints.length < 2) return;
    let cancelled = false;
    setIsLoadingRoute(true);
    setStores([]);
    setSelectedId(null);
    const points = waypoints.map(({ latitude, longitude }) => ({ latitude, longitude }));

    (async () => {
      try {
        const [config, route] = await Promise.all([
          mapConfigClient.getMapboxToken(),
          routeComputeClient.compute({ waypoints: points, transportMode: "CAR" }),
        ]);
        if (cancelled) return;
        setMapboxToken(config.token);
        setPolyline(route.polyline);
        // Los comercios de paso se piden con la ruta real: el desvío sale de las calles.
        const nearby = await routeComputeClient
          .nearbyStores({ waypoints: points, polyline: route.polyline })
          .catch(() => ({ stores: [] as NearbyStore[] }));
        if (!cancelled) setStores(nearby.stores);
      } catch {
        if (!cancelled) {
          setMapboxToken(null);
          setPolyline(null);
        }
      } finally {
        if (!cancelled) setIsLoadingRoute(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [waypoints]);

  const mapWaypoints = useMemo(
    () => waypoints.map(({ latitude, longitude }) => ({ latitude, longitude })),
    [waypoints],
  );
  // Paradas de compra del plan (grandes y de color) + el resto de los comercios de paso (chicos).
  const planStops = useMemo(
    () => [...(plan?.stops ?? [])].sort((a, b) => (a.routeIndex ?? a.order) - (b.routeIndex ?? b.order)),
    [plan],
  );
  const mapStores = useMemo(() => {
    const buyIds = new Set(planStops.map((stop) => stop.storeBranchId));
    const buy = planStops
      .filter((stop) => stop.latitude !== undefined && stop.longitude !== undefined)
      .map((stop) => ({
        id: stop.storeBranchId,
        name: stop.storeName,
        latitude: stop.latitude!,
        longitude: stop.longitude!,
        buy: true,
      }));
    const others = stores
      .filter((store) => !buyIds.has(store.branchId))
      .map((store) => ({
        id: store.branchId,
        name: store.storeName,
        latitude: store.latitude,
        longitude: store.longitude,
      }));
    return [...buy, ...others];
  }, [stores, planStops]);
  const selected = stores.find((store) => store.branchId === selectedId) ?? null;
  const selectedStop = planStops.find((stop) => stop.storeBranchId === selectedId) ?? null;

  if (waypoints.length < 2) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <EmptyState
          emoji="🗺️"
          title="Todavía no tenés una ruta activa"
          description="Elegí de dónde salís y a dónde vas, y te mostramos qué tenés de paso."
          action={
            <AnimatedPressable
              accessibilityLabel="Elegir recorrido"
              onPress={() => router.push("/route-context")}
              style={s.emptyAction}
            >
              <Text style={s.emptyActionText}>Elegir mi recorrido</Text>
            </AnimatedPressable>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Tu recorrido</Text>
            <Text style={s.subtitle}>
              {isLoadingRoute
                ? "Buscando qué tenés de paso…"
                : stores.length > 0
                  ? `Tenés ${stores.length} ${stores.length === 1 ? "comercio" : "comercios"} de paso`
                  : `${waypoints.length} paradas en orden`}
            </Text>
          </View>
          <AnimatedPressable
            accessibilityLabel="Editar recorrido"
            haptic={false}
            onPress={() => router.push("/route-context")}
            style={s.edit}
          >
            <Ionicons name="create-outline" size={19} color={colors.text.primary} />
          </AnimatedPressable>
        </View>

        {isLoadingRoute ? (
          <View style={s.mapLoading}>
            <ActivityIndicator color={colors.brand.navy} />
          </View>
        ) : mapboxToken ? (
          <View>
            <RouteMapView
              waypoints={mapWaypoints}
              polyline={plan ? (planPolyline ?? polyline) : polyline}
              basePolyline={plan && planPolyline ? polyline : null}
              mapboxToken={mapboxToken}
              stores={mapStores}
              selectedStoreId={selectedId}
              onSelectStore={setSelectedId}
            />
            <AnimatedPressable
              accessibilityLabel="Ver el mapa en pantalla completa"
              onPress={() => setFullMap(true)}
              style={s.expandButton}
            >
              <Ionicons name="expand-outline" size={18} color={colors.text.primary} />
              <Text style={s.expandLabel}>Ampliar</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <View style={s.routeCard}>
            <Ionicons name="navigate-outline" size={30} color={colors.brand.route} />
            <Text style={s.routeLabel}>Tu recorrido de hoy</Text>
            <Text style={s.routeHint}>
              El mapa visual necesita un token de Mapbox configurado — ver docs/development/GEOCODING-SETUP.md (misma key).
            </Text>
          </View>
        )}

        {routePlans.length > 1 && planIsCurrent ? (
          <View accessibilityRole="tablist" style={s.planTabs}>
            {routePlans.map((option) => {
              const selectedOption = routePlan?.label === option.label;
              const title = option.label === "FASTEST" ? "Sin desvíos" : option.label === "BALANCED" ? "Intermedio" : "Hipereconómico";
              return (
                <Pressable
                  key={option.label}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: selectedOption }}
                  accessibilityLabel={`Ver la opción ${title}`}
                  onPress={() => {
                    setSelectedId(null);
                    setRoutePlan(option);
                  }}
                  style={[s.planTab, selectedOption ? s.planTabSelected : null]}
                >
                  <Text style={[s.planTabLabel, selectedOption ? s.planTabLabelSelected : null]} numberOfLines={1}>
                    {title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {plan ? (
          <View style={s.planCard}>
            <Text style={s.planEyebrow}>TU COMPRA DE PASO</Text>
            <Text style={s.planTitle}>
              {money(plan.totalProductCost)}
              {plan.estimatedSavings > 0 ? ` · ahorrás ${money(plan.estimatedSavings)}` : ""}
            </Text>
            <Text style={s.address}>
              {plan.numberOfStops} {plan.numberOfStops === 1 ? "parada" : "paradas"} de compra · te desviás{" "}
              {Math.max(1, Math.ceil(plan.additionalTimeSeconds / 60))} min
              {planPolyline ? " (la línea punteada es tu recorrido original)" : ""}
            </Text>
            {planStops.map((stop, index) => {
              const isSelected = stop.storeBranchId === selectedId;
              const subtotal = stop.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
              return (
                <AnimatedPressable
                  key={stop.storeBranchId}
                  accessibilityLabel={`Parada de compra ${index + 1}: ${stop.storeName}`}
                  haptic={false}
                  onPress={() => setSelectedId(stop.storeBranchId)}
                  style={[s.buyStop, isSelected ? s.storeRowSelected : null]}
                >
                  <View style={s.buyHead}>
                    <View style={s.storeIcon}>
                      <Ionicons name="cart-outline" size={20} color={colors.text.onNavy} />
                    </View>
                    <View style={s.storeText}>
                      <Text style={s.storeName}>{stop.storeName}</Text>
                      <Text style={s.address} numberOfLines={1}>
                        {stop.address ?? stop.branchName}
                      </Text>
                      {stop.distanceFromRouteMeters !== undefined ? (
                        <Text style={s.detourStrong}>
                          {formatBlocks(stop.distanceFromRouteMeters)}
                          {stop.detourSeconds ? ` · +${Math.max(1, Math.round(stop.detourSeconds / 60))} min` : ""}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={s.buyTotal}>{money(subtotal)}</Text>
                  </View>
                  <Text style={s.buyItems}>
                    {stop.items.map((item) => `${item.quantity} × ${item.productName}`).join(" · ")}
                  </Text>
                </AnimatedPressable>
              );
            })}
            <View style={s.planActions}>
              <AnimatedPressable
                accessibilityLabel="Empezar compra"
                onPress={() => {
                  start(plan);
                  router.push("/purchase");
                }}
                style={s.selectedAction}
              >
                <Text style={s.selectedActionText}>Empezar compra</Text>
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityLabel="Recalcular compra de paso"
                haptic={false}
                onPress={() => router.push("/optimization")}
                style={s.secondaryAction}
              >
                <Text style={s.secondaryActionText}>Recalcular</Text>
              </AnimatedPressable>
            </View>
          </View>
        ) : (
          <AnimatedPressable
            accessibilityLabel="Armar mi compra de paso"
            onPress={() => router.push("/optimization")}
            style={s.planCta}
          >
            <Ionicons name="cart-outline" size={22} color={colors.text.primary} />
            <View style={s.storeText}>
              <Text style={s.storeName}>
                {routePlan ? "Cambiaste tu recorrido: recalculá" : "Armá tu compra de paso"}
              </Text>
              <Text style={s.address}>
                {routePlan
                  ? "La ruta con tu parada de compra ya no coincide con la de hoy."
                  : "Te decimos en qué comercio parar, el más barato de tu camino, y cuánto te desviás."}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </AnimatedPressable>
        )}

        {selected && !selectedStop ? (
          <View style={s.selectedCard}>
            <View style={s.storeIcon}>
              <Ionicons name="storefront-outline" size={20} color={colors.text.onNavy} />
            </View>
            <View style={s.storeText}>
              <Text style={s.storeName}>{selected.storeName}</Text>
              <Text style={s.address}>{selected.address}</Text>
              <Text style={s.detourStrong}>
                {selected.detourMeters < RIGHT_ON_ROUTE_METERS
                  ? "Lo tenés de paso: te queda sobre el camino."
                  : `Te desviás ${formatDetour(selected).replace("+", "")} y seguís.`}
              </Text>
            </View>
            <AnimatedPressable
              accessibilityLabel={`Comprar de paso en ${selected.storeName}`}
              onPress={() => router.push("/optimization")}
              style={s.selectedAction}
            >
              <Text style={s.selectedActionText}>Comprar de paso</Text>
            </AnimatedPressable>
          </View>
        ) : null}

        {stores.length > 0 ? (
          <>
            <Text style={s.section}>Lo que tenés de paso</Text>
            <Text style={s.sectionHint}>Ordenados por cuánto te sacan del camino.</Text>
            {stores.slice(0, 12).map((store) => {
              const isSelected = store.branchId === selectedId;
              return (
                <AnimatedPressable
                  key={store.branchId}
                  accessibilityLabel={`${store.storeName}, ${formatDetour(store)}`}
                  haptic={false}
                  onPress={() => setSelectedId(store.branchId)}
                  style={[s.storeRow, isSelected ? s.storeRowSelected : null]}
                >
                  <View style={s.storeIconSmall}>
                    <Ionicons name="storefront-outline" size={17} color={colors.text.primary} />
                  </View>
                  <View style={s.storeText}>
                    <Text style={s.storeName} numberOfLines={1}>
                      {store.storeName}
                    </Text>
                    <Text style={s.address} numberOfLines={1}>
                      {store.address}
                    </Text>
                  </View>
                  <View style={[s.chip, store.detourMeters < RIGHT_ON_ROUTE_METERS ? s.chipGood : null]}>
                    <Text style={s.chipText}>{formatDetour(store)}</Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </>
        ) : !isLoadingRoute && mapboxToken ? (
          <Text style={s.sectionHint}>No hay comercios sobre tu camino. Probá sumando una parada a tu recorrido.</Text>
        ) : null}

        <Modal visible={fullMap && Boolean(mapboxToken)} animationType="slide" onRequestClose={() => setFullMap(false)}>
          <SafeAreaView style={s.fullMap} edges={["top", "bottom"]}>
            {mapboxToken ? (
              <RouteMapView
                fill
                waypoints={mapWaypoints}
                polyline={plan ? (planPolyline ?? polyline) : polyline}
                basePolyline={plan && planPolyline ? polyline : null}
                mapboxToken={mapboxToken}
                stores={mapStores}
                selectedStoreId={selectedId}
                onSelectStore={setSelectedId}
              />
            ) : null}
            <AnimatedPressable
              accessibilityLabel="Cerrar el mapa"
              onPress={() => setFullMap(false)}
              style={s.closeMap}
            >
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </AnimatedPressable>
            {selectedStop || selected ? (
              <View style={s.fullMapCard}>
                <Text style={s.storeName}>{(selectedStop ?? selected)!.storeName}</Text>
                <Text style={s.address} numberOfLines={1}>
                  {selectedStop ? (selectedStop.address ?? selectedStop.branchName) : selected!.address}
                </Text>
                <Text style={s.detourStrong}>
                  {selectedStop ? formatBlocks(selectedStop.distanceFromRouteMeters) : formatDetour(selected!)}
                </Text>
              </View>
            ) : null}
          </SafeAreaView>
        </Modal>

        <Text style={s.section}>Paradas del recorrido</Text>
        {waypoints.map((w, i) => (
          <View key={w.key} style={s.stop}>
            <View style={s.rail}>
              <View style={s.number}>
                <Text style={s.numberText}>{i + 1}</Text>
              </View>
              {i < waypoints.length - 1 ? <View style={s.line} /> : null}
            </View>
            <View style={s.stopText}>
              <Text style={s.stopName}>{w.name}</Text>
              <Text style={s.address}>{i === waypoints.length - 1 ? "Destino final" : w.address}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontFamily: typography.heroTitle.fontFamily, fontSize: 24, color: colors.text.primary },
    subtitle: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.text.secondary },
    edit: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      alignItems: "center",
      justifyContent: "center",
    },
    mapLoading: {
      height: 300,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    routeCard: {
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.tint.blue.bg,
      borderWidth: 1,
      borderColor: colors.tint.blue.border,
    },
    routeLabel: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary },
    routeHint: {
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
      color: colors.text.secondary,
    },
    section: { fontFamily: typography.itemTitle.fontFamily, fontSize: 16, color: colors.text.primary, marginTop: spacing.sm },
    sectionHint: { fontFamily: typography.caption.fontFamily, fontSize: 13, color: colors.text.secondary, marginTop: -spacing.xs },
    selectedCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      flexWrap: "wrap",
    },
    storeIcon: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.brand.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    storeIconSmall: {
      width: 34,
      height: 34,
      borderRadius: radii.full,
      backgroundColor: colors.surface.input,
      alignItems: "center",
      justifyContent: "center",
    },
    storeText: { flex: 1, minWidth: 120 },
    storeName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    detourStrong: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.primary, marginTop: 4 },
    selectedAction: {
      minHeight: 44,
      backgroundColor: colors.brand.navy,
      borderRadius: radii.full,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedActionText: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 14, color: colors.text.onNavy },
    storeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      minHeight: 56,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.primary,
    },
    storeRowSelected: { borderColor: colors.text.primary, borderWidth: 2 },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radii.full,
      backgroundColor: colors.surface.input,
    },
    chipGood: { backgroundColor: colors.saving.lime },
    chipText: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.primary },
    stop: { flexDirection: "row", gap: spacing.sm, minHeight: 58 },
    rail: { alignItems: "center", width: 30 },
    number: {
      width: 30,
      height: 30,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brand.navy,
    },
    numberText: { fontFamily: typography.itemTitle.fontFamily, fontSize: 13, color: colors.text.onNavy },
    line: { width: 2, flex: 1, marginVertical: 4, backgroundColor: colors.brand.route },
    stopText: { flex: 1, paddingTop: 4 },
    stopName: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    address: { fontFamily: typography.caption.fontFamily, fontSize: 12, color: colors.text.secondary, marginTop: 2 },
    planTabs: { flexDirection: "row", padding: 4, borderRadius: radii.full, backgroundColor: colors.surface.input },
    planTab: { flex: 1, minHeight: 40, borderRadius: radii.full, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    planTabSelected: { backgroundColor: colors.brand.navy },
    planTabLabel: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    planTabLabelSelected: { color: colors.text.onNavy, fontWeight: "600" },
    planCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 2,
      borderColor: colors.saving.lime,
    },
    planEyebrow: { fontFamily: typography.caption.fontFamily, fontSize: 12, letterSpacing: 1, color: colors.brand.accentDark },
    planTitle: { fontFamily: typography.heroTitle.fontFamily, fontSize: 24, color: colors.text.primary },
    planCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    buyStop: {
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      backgroundColor: colors.surface.base,
    },
    buyHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    buyTotal: { fontFamily: typography.itemTitle.fontFamily, fontSize: 15, color: colors.text.primary },
    buyItems: { fontFamily: typography.caption.fontFamily, fontSize: 12, lineHeight: 17, color: colors.text.secondary },
    planActions: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" },
    secondaryAction: {
      minHeight: 44,
      borderRadius: radii.full,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    secondaryActionText: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 14, color: colors.text.primary },
    expandButton: {
      position: "absolute",
      right: spacing.sm,
      bottom: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 40,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    expandLabel: { fontFamily: typography.body.fontFamily, fontWeight: "600", fontSize: 14, color: colors.text.primary },
    fullMap: { flex: 1, backgroundColor: colors.surface.base },
    closeMap: {
      position: "absolute",
      top: spacing.xl + spacing.lg,
      left: spacing.lg,
      width: 48,
      height: 48,
      borderRadius: radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    fullMapCard: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      bottom: spacing.xl,
      gap: 2,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    emptyAction: {
      minHeight: 44,
      backgroundColor: colors.brand.navy,
      borderRadius: radii.full,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyActionText: { fontFamily: typography.buttonLabel.fontFamily, fontSize: 15, color: colors.text.onNavy },
  }),
);
