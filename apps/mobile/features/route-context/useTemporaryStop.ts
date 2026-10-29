import { ApiError } from "@depaso/api-client";
import { useState } from "react";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";
import { GEOCODING_NOT_CONFIGURED_MESSAGE, geocodeAddress } from "./helpers";

interface Options {
  addWaypoint: (waypoint: TodayWaypoint) => void;
  /** Se llama con la parada recién sumada (para preguntar si se quiere guardar). */
  onAdded: (waypoint: TodayWaypoint) => void;
}

/**
 * Parada de un solo uso: se escribe una dirección y un nombre, se convierte a coordenadas y se
 * suma al recorrido sin guardarla en "Mis lugares". El nombre también lo usa el selector del mapa.
 */
export function useTemporaryStop({ addWaypoint, onAdded }: Options) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const submit = async () => {
    if (!address.trim()) {
      setError("Ingresá una dirección.");
      return;
    }
    setIsGeocoding(true);
    try {
      const coords = await geocodeAddress(address);
      if (!coords) {
        setError("No pudimos ubicar esa dirección — probá ser más específico.");
        return;
      }
      const waypoint: TodayWaypoint = {
        key: `temp-${Date.now()}`,
        name: name.trim() || address.trim(),
        address: address.trim(),
        ...coords,
        emoji: "📍",
      };
      addWaypoint(waypoint);
      setVisible(false);
      setName("");
      setAddress("");
      setError(undefined);
      onAdded(waypoint);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 503) {
        setError(GEOCODING_NOT_CONFIGURED_MESSAGE);
      } else if (caught instanceof ApiError) {
        setError("No pudimos ubicar esa dirección. Probá de nuevo.");
      } else {
        // No es un error de la API sino de red: el servidor puede estar caído o inalcanzable.
        setError("No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  return { visible, open: () => setVisible(true), close: () => setVisible(false), name, setName, address, setAddress, error, isGeocoding, submit };
}
