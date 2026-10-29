import type { NearbyStore, OptimizationPlanResponse } from "@depaso/validation";
import { useEffect, useState } from "react";
import { mapConfigClient, routeComputeClient } from "@/lib/apiClient";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

/**
 * Datos del mapa: el token de Mapbox, la línea de la ruta de hoy, los comercios que quedan
 * de paso y, si hay un plan de compra, la línea de la ruta con la parada de compra.
 */
export function useRouteMapData(waypoints: TodayWaypoint[], plan: OptimizationPlanResponse | null) {
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [planPolyline, setPlanPolyline] = useState<string | null>(null);

  // línea del plan (la ruta pasando por las paradas de compra)
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

  // ruta de hoy y comercios de paso
  useEffect(() => {
    if (waypoints.length < 2) return;
    let cancelled = false;
    setIsLoadingRoute(true);
    setStores([]);
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

  return { mapboxToken, polyline, stores, isLoadingRoute, planPolyline };
}
