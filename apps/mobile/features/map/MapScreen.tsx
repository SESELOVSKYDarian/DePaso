import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, typography } from "@depaso/design-tokens";
import { AnimatedPressable } from "@/components/common/AnimatedPressable";
import { useToast } from "@/components/common/Toast";
import { PlaceSearchBox } from "@/components/map/PlaceSearchBox";
import { RouteMapView } from "@/components/map/RouteMapView";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useTodayRoute, type TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { findBrandLogo } from "@/lib/stores/matchBrandLogo";
import { useBrandLogos } from "@/lib/stores/useBrandLogos";
import { makeStyles, useColors } from "@/lib/theme";
import { ExploreMap } from "./components/ExploreMap";
import { MapControls } from "./components/MapControls";
import { MapSheet, PEEK_VISIBLE } from "./components/MapSheet";
import { NearbyStoresList, SelectedStoreCard } from "./components/NearbyStores";
import { NoRouteCard } from "./components/NoRouteCard";
import { PlanCard } from "./components/PlanCard";
import { PlanCta } from "./components/PlanCta";
import { PlanTabs } from "./components/PlanTabs";
import { RouteStops } from "./components/RouteStops";
import { SearchResultCard } from "./components/SearchResultCard";
import { sameBase } from "./helpers";
import { useMapSearch } from "./useMapSearch";
import { useMapToken } from "./useMapToken";
import { useRouteMapData } from "./useRouteMapData";

/** Una ruta tiene como máximo 6 paradas (origen, paradas y destino). */
const MAX_STOPS = 6;
/** Alto que ocupan el buscador y los botones arriba del mapa. */
const TOP_OVERLAY = 76;

/**
 * Mapa a pantalla completa: arriba flotan el buscador y los botones; abajo una hoja deslizable
 * con los comercios de paso (con su logo y cuánto te desviás) y el plan de compra. Sin recorrido,
 * queda un mapa para explorar y armar la ruta.
 */
export default function MapScreen() {
  const s = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { show: showToast } = useToast();
  const { waypoints, setWaypoints } = useTodayRoute();
  const { routePlan, routePlans, setRoutePlan } = usePurchase();
  const logos = useBrandLogos();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [expandSignal, setExpandSignal] = useState(0);
  const [satellite, setSatellite] = useState(false);

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

  const mapWaypoints = useMemo(
    () => waypoints.map(({ latitude, longitude, name }) => ({ latitude, longitude, name })),
    [waypoints],
  );

  // Paradas de compra del plan (grandes) ordenadas a lo largo de la ruta.
  const planStops = useMemo(
    () => [...(plan?.stops ?? [])].sort((a, b) => (a.routeIndex ?? a.order) - (b.routeIndex ?? b.order)),
    [plan],
  );

  // Pines: las paradas de compra del plan + el resto de los comercios de paso, con el logo de la cadena.
  const mapStores = useMemo(() => {
    const logoOf = (name: string) => findBrandLogo(logos, name)?.imageDataUri;
    const buyIds = new Set(planStops.map((stop) => stop.storeBranchId));
    const buy = planStops
      .filter((stop) => stop.latitude !== undefined && stop.longitude !== undefined)
      .map((stop) => ({ id: stop.storeBranchId, name: stop.storeName, latitude: stop.latitude!, longitude: stop.longitude!, buy: true, logo: logoOf(stop.storeName) }));
    const others = stores
      .filter((store) => !buyIds.has(store.branchId))
      .map((store) => ({ id: store.branchId, name: store.storeName, latitude: store.latitude, longitude: store.longitude, logo: logoOf(store.storeName) }));
    return [...buy, ...others];
  }, [stores, planStops, logos]);

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

  // props del mapa con ruta; el encuadre deja libre lo que tapan el buscador y la hoja
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
        satellite,
        fitPadding: { top: insets.top + TOP_OVERLAY + 24, bottom: PEEK_VISIBLE + 24 },
      }
    : null;

  const sheetHeader = (
    <View style={s.sheetHeader}>
      <View style={s.sheetTitleBlock}>
        <Text accessibilityRole="header" style={s.sheetTitle}>
          {hasRoute ? "Comercios de paso" : "Explorá el mapa"}
        </Text>
        {!hasRoute ? <Text style={s.sheetHint}>Buscá un lugar o tocá el mapa</Text> : null}
        {hasRoute && isLoadingRoute ? <Text style={s.sheetHint}>Buscando qué tenés de paso…</Text> : null}
      </View>
      {hasRoute && stores.length > 0 ? (
        <AnimatedPressable accessibilityLabel="Ver todos los comercios de paso" haptic={false} onPress={() => setExpandSignal((n) => n + 1)}>
          <Text style={s.seeAll}>Ver todos</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );

  return (
    <View style={s.container} onLayout={(event) => setContainerHeight(event.nativeEvent.layout.height)}>
      {/* el mapa ocupa todo el fondo */}
      <View style={StyleSheet.absoluteFill}>
        {!hasRoute ? (
          <ExploreMap token={exploreToken} onPick={(point) => void search.choosePoint(point)} focus={search.focus} userLocation={search.userLocation} placePin={search.pinFocus} />
        ) : isLoadingRoute ? (
          <View style={s.mapLoading}>
            <ActivityIndicator color={colors.brand.route} />
          </View>
        ) : mapProps ? (
          <RouteMapView {...mapProps} fill />
        ) : (
          <View style={s.mapLoading}>
            <Text style={s.sheetHint}>El mapa necesita un token de Mapbox configurado en el servidor.</Text>
          </View>
        )}
      </View>

      {/* buscador y botones flotando arriba */}
      <View style={[s.searchLayer, { top: insets.top + spacing.sm }]}>
        <PlaceSearchBox near={search.userLocation} onSelect={search.chooseResult} placeholder="Buscar un lugar: Shell, Técnica 5, Colón 1234…" />
      </View>
      <View style={[s.controlsLayer, { top: insets.top + TOP_OVERLAY }]}>
        <MapControls
          onLocated={search.showUser}
          satellite={satellite}
          onToggleSatellite={() => setSatellite((value) => !value)}
          onEditRoute={hasRoute ? () => router.push("/route-builder") : undefined}
        />
      </View>

      {/* hoja deslizable con los comercios y el plan */}
      <MapSheet containerHeight={containerHeight} topGap={insets.top + TOP_OVERLAY} header={sheetHeader} expandSignal={expandSignal}>
        {search.place ? (
          <SearchResultCard
            place={search.place}
            actionLabel={hasRoute ? "Sumar como parada" : "Usar en mi recorrido"}
            onAdd={addPlaceToRoute}
            onClose={search.clearPlace}
          />
        ) : null}

        {!hasRoute ? <NoRouteCard stopCount={waypoints.length} /> : null}

        {hasRoute && selected && !selectedStop ? <SelectedStoreCard store={selected} /> : null}

        {hasRoute ? (
          <NearbyStoresList stores={stores} selectedId={selectedId} isLoading={isLoadingRoute} hasMap={Boolean(mapboxToken)} onSelect={setSelectedId} />
        ) : null}

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

        {waypoints.length > 0 ? <RouteStops waypoints={waypoints} /> : null}
      </MapSheet>
    </View>
  );
}

const useStyles = makeStyles((colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface.base },
    mapLoading: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.surface.secondary },
    searchLayer: { position: "absolute", left: spacing.md, right: spacing.md, zIndex: 30 },
    controlsLayer: { position: "absolute", right: spacing.md, zIndex: 20 },
    sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    sheetTitleBlock: { flex: 1, gap: 2 },
    sheetTitle: { fontFamily: typography.screenTitle.fontFamily, fontSize: 20, color: colors.text.primary },
    sheetHint: { fontFamily: typography.body.fontFamily, fontSize: 13, color: colors.text.secondary },
    seeAll: { fontFamily: typography.itemTitle.fontFamily, fontSize: 14, color: colors.brand.route },
  }),
);
