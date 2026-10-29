import * as Location from "expo-location";
import { useState } from "react";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

type Point = { latitude: number; longitude: number };

interface Options {
  addWaypoint: (waypoint: TodayWaypoint) => void;
  /** Dirección legible de un punto (o `null` si no se pudo averiguar). */
  describePoint: (point: Point) => Promise<string | null>;
  showToast: (message: string, kind: "success" | "error" | "info") => void;
}

/** Suma la ubicación GPS actual como una parada del recorrido. */
export function useCurrentLocationStop({ addWaypoint, describePoint, showToast }: Options) {
  const [isLocating, setIsLocating] = useState(false);

  const addCurrentLocation = async () => {
    // Un solo pedido a la vez: el GPS puede tardar y antes cada toque sumaba otra parada.
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("No pudimos acceder a tu ubicación.", "error");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const address = await describePoint(point);
      addWaypoint({
        key: `current-${Date.now()}`,
        name: "Ubicación actual",
        address: address ?? "Tu ubicación en este momento",
        ...point,
        emoji: "📍",
      });
    } catch {
      showToast("No pudimos leer tu ubicación. Probá de nuevo o elegila en el mapa.", "error");
    } finally {
      setIsLocating(false);
    }
  };

  return { isLocating, addCurrentLocation };
}
