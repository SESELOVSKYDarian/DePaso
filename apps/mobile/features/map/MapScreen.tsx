import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useToast } from "@/components/common/Toast";
import { PlaceSearchBox } from "@/components/map/PlaceSearchBox";
import { RouteMapView } from "@/components/map/RouteMapView";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useTodayRoute, type TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { useColors } from "@/lib/theme";
import { ExploreMap } from "./components/ExploreMap";
import { FullMapModal } from "./components/FullMapModal";
import { MapTools } from "./components/MapTools";
import { NearbyStoresList, SelectedStoreCard } from "./components/NearbyStores";
import { NoRouteCard } from "./components/NoRouteCard";
import { PlanCard } from "./components/PlanCard";
import { PlanCta } from "./components/PlanCta";
import { PlanTabs } from "./components/PlanTabs";
import { RouteStops } from "./components/RouteStops";
import { SearchResultCard } from "./components/SearchResultCard";
import { sameBase } from "./helpers";
import { useStyles } from "./styles";
import { useMapSearch } from "./useMapSearch";
import { useMapToken } from "./useMapToken";
import { useRouteMapData } from "./useRouteMapData";

/** Una ruta tiene como máximo 6 paradas (origen, paradas y destino). */
const MAX_STOPS = 6;

/**
 * Mapa: buscar un lugar (como en Google Maps), ver dónde estás y planificar el recorrido de hoy.
 * Con recorrido, muestra la ruta con sus paradas y los comercios que quedan "de paso", con cuánto
 * te desviás para pasar por cada uno. Sin recorrido, queda un mapa para explorar y armar la ruta.
 */
export default function MapScreen() {
  const s = useStyles();
  const colors = useColors();
  const { show: showToast } = useToast();
  const { waypoints, setWaypoints } = useTodayRoute();
  const { routePlan, routePlans, setRoutePlan } = usePurchase();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Mapa a pantalla completa: en el recuadro chico costaba moverse y tocar los comercios.
  const [fullMap, setFullMap] = useState(false);

  const hasRoute = waypoints.length >= 2;
  const search = useMapSearch();
  const exploreToken = useMapToken();

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

  // Suma el lugar buscado al recorrido: con ruta armada entra como parada antes del destino.
  const addPlaceToRoute = () => {
    const place = search.place;
    if (!place) return;
    if (waypoints.length >= MAX_STOPS) {
      showToast(`Tu recorrido ya tiene ${MAX_STOPS} paradas, el máximo.`, "error");
      return;
    }
    const stop: TodayWaypoint = {
      key: `search-${Date.now()}`,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      emoji: "📍",
    };
    const last = waypoints[waypoints.length - 1];
    setWaypoints(hasRoute && last ? [...waypoints.slice(0, -1), stop, last] : [...waypoints, stop]);
    search.clearPlace();
    showToast(`Sumamos "${place.name}" a tu recorrido.`, "success");
  };

  const subtitle = !hasRoute
    ? "Buscá un lugar o tocá el mapa"
    : isLoadingRoute
      ? "Buscando qué tenés de paso…"
      : stores.length > 0
        ? `Tenés ${stores.length} ${stores.length === 1 ? "comercio" : "comercios"} de paso`
        : `${waypoints.length} paradas en orden`;

  // props que comparten el mapa chico y el de pantalla completa
  const searchPin = search.place ? { latitude: search.place.latitude, longitude: search.place.longitude } : null;
  const mapProps = mapboxToken
    ? {
        waypoints: mapWaypoints,
        polyline: plan ? (planPolyline ?? polyline) : polyline,
        basePolyline: plan && planPolyline ? polyline : null,
        mapboxToken,
        stores: mapStores,
        selectedStoreId: selectedId,
        onSelectStore: setSelectedId,
        focus: search.focus,
        userLocation: search.userLocation,
        searchPin,
      }
    : null;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View>
            <Text style={s.title}>Mapa</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>
          {hasRoute ? (
            <AnimatedPressable accessibilityLabel="Editar recorrido" haptic={false} onPress={() => router.push("/route-context")} style={s.edit}>
              <Ionicons name="create-outline" size={19} color={colors.text.primary} />
            </AnimatedPressable>
          ) : null}
        </View>

        <PlaceSearchBox near={search.userLocation} onSelect={search.chooseResult} placeholder="Buscar un lugar: Shell, Técnica 5, Colón 1234…" />

        {!hasRoute ? (
          <MapTools onLocated={search.showUser}>
            <ExploreMap token={exploreToken} onPick={(point) => void search.choosePoint(point)} focus={search.focus} userLocation={search.userLocation} placePin={search.pinFocus} />
          </MapTools>
        ) : isLoadingRoute ? (
          <View style={s.mapLoading}>
            <ActivityIndicator color={colors.brand.navy} />
          </View>
        ) : mapProps ? (
          <MapTools onLocated={search.showUser}>
            <RouteMapView {...mapProps} />
            <AnimatedPressable accessibilityLabel="Ver el mapa en pantalla completa" onPress={() => setFullMap(true)} style={s.expandButton}>
              <Ionicons name="expand-outline" size={18} color={colors.text.primary} />
              <Text style={s.expandLabel}>Ampliar</Text>
            </AnimatedPressable>
          </MapTools>
        ) : (
          <View style={s.routeCard}>
            <Ionicons name="navigate-outline" size={30} color={colors.brand.route} />
            <Text style={s.routeLabel}>Tu recorrido de hoy</Text>
            <Text style={s.routeHint}>
              El mapa visual necesita un token de Mapbox configurado — ver docs/development/GEOCODING-SETUP.md (misma key).
            </Text>
          </View>
        )}

        {search.place ? (
          <SearchResultCard
            place={search.place}
            actionLabel={hasRoute ? "Sumar como parada" : "Usar en mi recorrido"}
            onAdd={addPlaceToRoute}
            onClose={search.clearPlace}
          />
        ) : null}

        {!hasRoute ? <NoRouteCard stopCount={waypoints.length} /> : null}

        {hasRoute && routePlans.length > 1 && planIsCurrent ? (
          <PlanTabs
            plans={routePlans}
            selectedLabel={routePlan?.label}
            onSelect={(option) => {
              setSelectedId(null);
              setRoutePlan(option);
            }}
          />
        ) : null}

        {hasRoute ? (
          plan ? (
            <PlanCard plan={plan} stops={planStops} selectedId={selectedId} hasPlanLine={Boolean(planPolyline)} onSelectStop={setSelectedId} />
          ) : (
            <PlanCta hasOldPlan={routePlan !== null} />
          )
        ) : null}

        {hasRoute && selected && !selectedStop ? <SelectedStoreCard store={selected} /> : null}

        {hasRoute ? (
          <NearbyStoresList stores={stores} selectedId={selectedId} isLoading={isLoadingRoute} hasMap={Boolean(mapboxToken)} onSelect={setSelectedId} />
        ) : null}

        {hasRoute && mapProps ? (
          <FullMapModal visible={fullMap} mapProps={mapProps} selectedStop={selectedStop} selectedStore={selected} onClose={() => setFullMap(false)} />
        ) : null}

        {waypoints.length > 0 ? <RouteStops waypoints={waypoints} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
