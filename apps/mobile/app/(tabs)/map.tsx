import { Ionicons } from "@expo/vector-icons";
import type { NearbyStore } from "@depaso/validation";
import { radii, spacing, typography } from "@depaso/design-tokens";
import { makeStyles, useColors } from "@/lib/theme";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EmptyState } from "@/components/EmptyState";
import { RouteMapView } from "@/components/RouteMapView";
import { mapConfigClient, routeComputeClient } from "@/lib/apiClient";
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
  const mapStores = useMemo(
    () =>
      stores.map((store) => ({
        id: store.branchId,
        name: store.storeName,
        latitude: store.latitude,
        longitude: store.longitude,
      })),
    [stores],
  );
  const selected = stores.find((store) => store.branchId === selectedId) ?? null;

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
          <RouteMapView
            waypoints={mapWaypoints}
            polyline={polyline}
            mapboxToken={mapboxToken}
            stores={mapStores}
            selectedStoreId={selectedId}
            onSelectStore={setSelectedId}
          />
        ) : (
          <View style={s.routeCard}>
            <Ionicons name="navigate-outline" size={30} color={colors.brand.route} />
            <Text style={s.routeLabel}>Tu recorrido de hoy</Text>
            <Text style={s.routeHint}>
              El mapa visual necesita un token de Mapbox configurado — ver docs/development/GEOCODING-SETUP.md (misma key).
            </Text>
          </View>
        )}

        {selected ? (
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
