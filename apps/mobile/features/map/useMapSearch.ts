import type { PlaceSuggestionResponse } from "@depaso/validation";
import { useRef, useState } from "react";
import { geocodeClient } from "@/lib/apiClient";
import type { MapFocus, MapPoint } from "@/lib/map/mapCommands";

/** Un lugar elegido en el mapa (con el buscador o tocando el mapa). */
export interface PickedPlace {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  kind: PlaceSuggestionResponse["kind"] | "point";
}

/** Acerca la cámara a este nivel cuando se elige un lugar o se encuentra al usuario. */
const PLACE_ZOOM = 16;

/**
 * Estado de las herramientas del mapa: el lugar elegido con el buscador (o tocando el mapa),
 * dónde está el usuario y hacia dónde tiene que mirar la cámara.
 */
export function useMapSearch() {
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [userLocation, setUserLocation] = useState<MapPoint | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  // pedido de poner el pin en el mapa de exploración (el de la ruta usa `place` directamente)
  const [pinFocus, setPinFocus] = useState<MapFocus | null>(null);
  const nonce = useRef(0);

  const flyTo = (point: MapPoint) => setFocus({ point, zoom: PLACE_ZOOM, nonce: ++nonce.current });

  /** Eligió un resultado del buscador. */
  const chooseResult = (result: PlaceSuggestionResponse) => {
    const point = { latitude: result.latitude, longitude: result.longitude };
    setPlace({ ...point, name: result.name, address: result.address, kind: result.kind });
    setPinFocus({ point, zoom: PLACE_ZOOM, nonce: ++nonce.current });
    flyTo(point);
  };

  /** Tocó un punto del mapa: se busca su dirección (si falla, queda solo el punto). */
  const choosePoint = async (point: MapPoint) => {
    setPlace({ ...point, name: "Punto del mapa", address: "Buscando la dirección…", kind: "point" });
    try {
      const { address } = await geocodeClient.reverse(point);
      setPlace({ ...point, name: address.split(",")[0] || "Punto del mapa", address, kind: "point" });
    } catch {
      setPlace({ ...point, name: "Punto del mapa", address: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`, kind: "point" });
    }
  };

  /** Se encontró al usuario: se muestra el punto azul y la cámara va hacia él. */
  const showUser = (point: MapPoint) => {
    setUserLocation(point);
    flyTo(point);
  };

  return { place, userLocation, focus, pinFocus, chooseResult, choosePoint, showUser, clearPlace: () => setPlace(null) };
}
