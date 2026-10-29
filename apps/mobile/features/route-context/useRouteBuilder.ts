import type { UserPlaceResponse } from "@depaso/validation";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/common/Toast";
import { geocodeClient } from "@/lib/apiClient";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import { usePlaces } from "@/lib/places/PlacesContext";
import { useTodayRoute, type TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { useCurrentLocationStop } from "./useCurrentLocationStop";
import { useMapPicking } from "./useMapPicking";
import { useSavedRoutes } from "./useSavedRoutes";
import { useSavePlaceDialog } from "./useSavePlaceDialog";
import { useTemporaryStop } from "./useTemporaryStop";

type Point = { latitude: number; longitude: number };

/** Dirección legible de un punto; si falla, se describe sin dirección. */
async function describePoint(point: Point): Promise<string | null> {
  try {
    const { address } = await geocodeClient.reverse(point);
    return address;
  } catch {
    return null;
  }
}

/**
 * Todo lo que hace la pantalla "Armar ruta": las paradas en edición (que recién pasan a ser el
 * recorrido de hoy al tocar "Listo"), las formas de sumar una parada y las rutas guardadas.
 * Puede abrirse con un lugar (`addPlace`) o con la ubicación actual (`withLocation`) ya sumados.
 */
export function useRouteBuilder() {
  const { places, createPlace } = usePlaces();
  const { waypoints: savedToday, setWaypoints: commitToday } = useTodayRoute();
  const { show: showToast } = useToast();
  const params = useLocalSearchParams<{ addPlace?: string; withLocation?: string }>();

  // las paradas se editan acá y se confirman al final
  const [waypoints, setWaypoints] = useState<TodayWaypoint[]>(savedToday);
  const addWaypoint = (waypoint: TodayWaypoint) => setWaypoints((previous) => [...previous, waypoint]);
  const removeWaypoint = (key: string) => setWaypoints((previous) => previous.filter((stop) => stop.key !== key));

  const savePlace = useSavePlaceDialog({ createPlace, setWaypoints, showToast });
  const temporary = useTemporaryStop({ addWaypoint, onAdded: savePlace.ask });
  const location = useCurrentLocationStop({ addWaypoint, describePoint, showToast });
  const map = useMapPicking(describePoint);
  const saved = useSavedRoutes(waypoints, setWaypoints, places, showToast);

  const selectedPlaceIds = new Set(waypoints.map((stop) => stop.placeId).filter(Boolean));

  // tildar o destildar un lugar guardado
  const togglePlace = (place: UserPlaceResponse) => {
    if (selectedPlaceIds.has(place.id)) {
      removeWaypoint(place.id);
      return;
    }
    addWaypoint({
      key: place.id,
      placeId: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      emoji: PLACE_TYPE_META[place.type].emoji,
    });
  };

  // si se abrió con un lugar o con la ubicación actual, se suma una sola vez
  const appliedParams = useRef(false);
  useEffect(() => {
    if (appliedParams.current) return;
    if (params.withLocation === "1") {
      appliedParams.current = true;
      void location.addCurrentLocation();
      return;
    }
    const place = params.addPlace ? places.find((candidate) => candidate.id === params.addPlace) : undefined;
    if (place) {
      appliedParams.current = true;
      togglePlace(place);
    }
    // las funciones se redefinen en cada render: sólo importa el primer pasaje
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.addPlace, params.withLocation, places]);

  const openMapPicker = () => {
    temporary.close();
    void map.open(() => showToast("No pudimos abrir el mapa. Escribí la dirección.", "error"));
  };

  // confirmo el punto tocado en el mapa
  const addPickedPoint = () => {
    if (!map.picked) return;
    const address = map.pickedAddress ?? `${map.picked.latitude.toFixed(5)}, ${map.picked.longitude.toFixed(5)}`;
    const waypoint: TodayWaypoint = {
      key: `map-${Date.now()}`,
      name: temporary.name.trim() || address.split(",")[0] || "Punto del mapa",
      address,
      ...map.picked,
      emoji: "📍",
    };
    addWaypoint(waypoint);
    map.close();
    temporary.setName("");
    savePlace.ask(waypoint);
  };

  // dejo las paradas como el recorrido de hoy y vuelvo
  const done = () => {
    commitToday(waypoints);
    router.back();
  };

  return {
    places,
    waypoints,
    selectedPlaceIds,
    togglePlace,
    removeWaypoint,
    openMapPicker,
    addPickedPoint,
    done,
    map,
    saved,
    savePlace,
    temporary,
    location,
  };
}
