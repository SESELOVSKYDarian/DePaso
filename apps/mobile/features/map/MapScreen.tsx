import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { EmptyState } from "@/components/common/EmptyState";
import { RouteMapView } from "@/components/map/RouteMapView";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";
import { useColors } from "@/lib/theme";
import { FullMapModal } from "./components/FullMapModal";
import { NearbyStoresList, SelectedStoreCard } from "./components/NearbyStores";
import { PlanCard } from "./components/PlanCard";
import { PlanCta } from "./components/PlanCta";
import { PlanTabs } from "./components/PlanTabs";
import { RouteStops } from "./components/RouteStops";
import { sameBase } from "./helpers";
import { useStyles } from "./styles";
import { useRouteMapData } from "./useRouteMapData";

/**
 * Mapa del recorrido de hoy: la ruta con sus paradas y, sobre ella, los comercios que te
 * quedan "de paso" con cuánto te desviás para pasar por cada uno. Mapbox GL JS real cuando
 * hay token configurado; si no, queda el orden de paradas y las direcciones.
 */
export default function MapScreen() {
  const s = useStyles();
  const colors = useColors();
  const { waypoints } = useTodayRoute();
  const { routePlan, routePlans, setRoutePlan } = usePurchase();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Mapa a pantalla completa: en el recuadro chico costaba moverse y tocar los comercios.
  const [fullMap, setFullMap] = useState(false);

  // El plan sólo vale mientras el recorrido sea el mismo con el que se calculó: si lo editaste
  // (cambió el origen, el destino o una parada) hay que recalcular.
  const planIsCurrent = routePlan !== null && sameBase(routePlan, waypoints);
  const plan = planIsCurrent ? routePlan : null;

  const { mapboxToken, polyline, stores, isLoadingRoute, planPolyline } = useRouteMapData(waypoints, plan);

  // si cambia el recorrido, se limpia el comercio elegido
  useEffect(() => setSelectedId(null), [waypoints]);

  const mapWaypoints = useMemo(() => waypoints.map(({ latitude, longitude }) => ({ latitude, longitude })), [waypoints]);

  // Paradas de compra del plan (grandes y de color) ordenadas a lo largo de la ruta.
  const planStops = useMemo(
    () => [...(plan?.stops ?? [])].sort((a, b) => (a.routeIndex ?? a.order) - (b.routeIndex ?? b.order)),
    [plan],
  );

  // Marcadores: las paradas de compra del plan + el resto de los comercios de paso (chicos).
  const mapStores = useMemo(() => {
    const buyIds = new Set(planStops.map((stop) => stop.storeBranchId));
    const buy = planStops
      .filter((stop) => stop.latitude !== undefined && stop.longitude !== undefined)
      .map((stop) => ({ id: stop.storeBranchId, name: stop.storeName, latitude: stop.latitude!, longitude: stop.longitude!, buy: true }));
    const others = stores
      .filter((store) => !buyIds.has(store.branchId))
      .map((store) => ({ id: store.branchId, name: store.storeName, latitude: store.latitude, longitude: store.longitude }));
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
            <AnimatedPressable accessibilityLabel="Elegir recorrido" onPress={() => router.push("/route-context")} style={s.emptyAction}>
              <Text style={s.emptyActionText}>Elegir mi recorrido</Text>
            </AnimatedPressable>
          }
        />
      </SafeAreaView>
    );
  }

  const subtitle = isLoadingRoute
    ? "Buscando qué tenés de paso…"
    : stores.length > 0
      ? `Tenés ${stores.length} ${stores.length === 1 ? "comercio" : "comercios"} de paso`
      : `${waypoints.length} paradas en orden`;

  // props que comparten el mapa chico y el de pantalla completa
  const mapProps = mapboxToken
    ? {
        waypoints: mapWaypoints,
        polyline: plan ? (planPolyline ?? polyline) : polyline,
        basePolyline: plan && planPolyline ? polyline : null,
        mapboxToken,
        stores: mapStores,
        selectedStoreId: selectedId,
        onSelectStore: setSelectedId,
      }
    : null;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Tu recorrido</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>
          <AnimatedPressable accessibilityLabel="Editar recorrido" haptic={false} onPress={() => router.push("/route-context")} style={s.edit}>
            <Ionicons name="create-outline" size={19} color={colors.text.primary} />
          </AnimatedPressable>
        </View>

        {isLoadingRoute ? (
          <View style={s.mapLoading}>
            <ActivityIndicator color={colors.brand.navy} />
          </View>
        ) : mapProps ? (
          <View>
            <RouteMapView {...mapProps} />
            <AnimatedPressable accessibilityLabel="Ver el mapa en pantalla completa" onPress={() => setFullMap(true)} style={s.expandButton}>
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
          <PlanTabs
            plans={routePlans}
            selectedLabel={routePlan?.label}
            onSelect={(option) => {
              setSelectedId(null);
              setRoutePlan(option);
            }}
          />
        ) : null}

        {plan ? (
          <PlanCard plan={plan} stops={planStops} selectedId={selectedId} hasPlanLine={Boolean(planPolyline)} onSelectStop={setSelectedId} />
        ) : (
          <PlanCta hasOldPlan={routePlan !== null} />
        )}

        {selected && !selectedStop ? <SelectedStoreCard store={selected} /> : null}

        <NearbyStoresList stores={stores} selectedId={selectedId} isLoading={isLoadingRoute} hasMap={Boolean(mapboxToken)} onSelect={setSelectedId} />

        {mapProps ? (
          <FullMapModal visible={fullMap} mapProps={mapProps} selectedStop={selectedStop} selectedStore={selected} onClose={() => setFullMap(false)} />
        ) : null}

        <RouteStops waypoints={waypoints} />
      </ScrollView>
    </SafeAreaView>
  );
}
