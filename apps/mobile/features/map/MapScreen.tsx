import { Ionicons } from "@expo/vector-icons";
import type { NearbyStore, OptimizationPlanResponse } from "@depaso/validation";
import { makeStyles, useColors } from "@/lib/theme";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { RouteMapView } from "@/components/map/RouteMapView";
import { mapConfigClient, routeComputeClient } from "@/lib/apiClient";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";
import { useStyles } from "./styles";
import { RIGHT_ON_ROUTE_METERS, formatDetour, money, formatBlocks, sameBase } from "./helpers";

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
