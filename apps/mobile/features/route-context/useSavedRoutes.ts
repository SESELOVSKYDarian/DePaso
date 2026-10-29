import type { RouteContextResponse, UserPlaceResponse } from "@depaso/validation";
import { useEffect, useState } from "react";
import { routeContextClient } from "@/lib/apiClient";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

type Toast = (message: string, kind: "success" | "error" | "info") => void;

/**
 * Rutas que el usuario guardó con nombre: las trae del servidor, las aplica al recorrido de
 * hoy, guarda una nueva con el recorrido actual y las borra.
 */
export function useSavedRoutes(
  waypoints: TodayWaypoint[],
  setWaypoints: (waypoints: TodayWaypoint[]) => void,
  places: UserPlaceResponse[],
  showToast: Toast,
) {
  const [presets, setPresets] = useState<RouteContextResponse[]>([]);
  /** `null` = formulario de guardado cerrado */
  const [savingName, setSavingName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    routeContextClient
      .list()
      .then((res) => setPresets(res.routeContexts))
      .catch(() => {
        // Sin rutas guardadas todavía (o sin conexión): no bloquea el resto de la pantalla.
      });
  }, []);

  // cargo una ruta guardada como recorrido de hoy
  const apply = (preset: RouteContextResponse) => {
    if (preset.stops && preset.stops.length > 0) {
      setWaypoints(
        preset.stops.map((stop, index) => ({
          key: stop.placeId ?? `saved-${preset.id}-${index}`,
          ...(stop.placeId ? { placeId: stop.placeId } : {}),
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          emoji: stop.emoji,
        })),
      );
    } else {
      // rutas viejas: solo tienen ids de lugares guardados
      const resolved = preset.waypointPlaceIds
        .map((id) => places.find((p) => p.id === id))
        .filter((p): p is UserPlaceResponse => p !== undefined)
        .map((place) => ({
          key: place.id,
          placeId: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          emoji: PLACE_TYPE_META[place.type].emoji,
        }));
      setWaypoints(resolved);
    }
    showToast(`Cargaste "${preset.name}"`, "success");
  };

  // guardo el recorrido actual con el nombre escrito
  const save = async () => {
    const name = savingName?.trim();
    if (!name || waypoints.length < 2 || isSaving) return;
    setIsSaving(true);
    try {
      const created = await routeContextClient.create({
        name,
        stops: waypoints.map((w) => ({
          name: w.name,
          address: w.address,
          latitude: w.latitude,
          longitude: w.longitude,
          emoji: w.emoji,
          ...(w.placeId ? { placeId: w.placeId } : {}),
        })),
      });
      setPresets((prev) => [created, ...prev]);
      setSavingName(null);
      showToast(`Guardamos "${created.name}". La tenés arriba para usarla cuando quieras.`, "success");
    } catch {
      showToast("No pudimos guardar el recorrido. Probá de nuevo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (preset: RouteContextResponse) => {
    try {
      await routeContextClient.remove(preset.id);
      setPresets((prev) => prev.filter((p) => p.id !== preset.id));
      showToast(`Borramos "${preset.name}".`, "info");
    } catch {
      showToast("No pudimos borrar la ruta.", "error");
    }
  };

  return { presets, savingName, setSavingName, isSaving, apply, save, remove };
}
