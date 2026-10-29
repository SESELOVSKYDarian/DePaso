import type { UserPlaceInput, UserPlaceResponse } from "@depaso/validation";
import { useState } from "react";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

interface Options {
  createPlace: (input: UserPlaceInput) => Promise<UserPlaceResponse>;
  /** Para dejar la parada vinculada al lugar recién guardado. */
  setWaypoints: (update: (previous: TodayWaypoint[]) => TodayWaypoint[]) => void;
  showToast: (message: string, kind: "success" | "error" | "info") => void;
}

/**
 * "¿Guardar este lugar para otra vez?": después de sumar una parada suelta se pregunta si va a
 * "Mis lugares". Solo se guarda con la confirmación explícita del usuario.
 */
export function useSavePlaceDialog({ createPlace, setWaypoints, showToast }: Options) {
  const [pending, setPending] = useState<TodayWaypoint | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const confirm = async () => {
    if (!pending || isSaving) return;
    setIsSaving(true);
    try {
      const created = await createPlace({
        name: pending.name.slice(0, 80),
        type: "CUSTOM",
        address: pending.address.slice(0, 200),
        latitude: pending.latitude,
        longitude: pending.longitude,
        isFavorite: false,
      });
      setWaypoints((previous) => previous.map((stop) => (stop.key === pending.key ? { ...stop, key: created.id, placeId: created.id } : stop)));
      showToast(`Guardamos "${created.name}" en Mis lugares.`, "success");
    } catch {
      showToast("No pudimos guardar el lugar. Probá de nuevo.", "error");
    } finally {
      setIsSaving(false);
      setPending(null);
    }
  };

  return { pending, isSaving, ask: setPending, cancel: () => setPending(null), confirm };
}
