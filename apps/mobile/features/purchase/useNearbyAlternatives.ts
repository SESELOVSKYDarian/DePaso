import type { NearbyPrice } from "@depaso/validation";
import { useEffect, useState } from "react";
import { productsClient } from "@/lib/apiClient";
import type { PlanItem, PlanStop } from "./helpers";

type State = { status: "idle" } | { status: "loading" } | { status: "failed" } | { status: "ready"; options: NearbyPrice[] };

/**
 * Cuando en un comercio no había más de un producto: busca dónde conseguirlo cerca de ahí, lo más
 * barato y cercano. Se parte desde el comercio en el que se está (no hace falta pedir la ubicación).
 */
export function useNearbyAlternatives(stop: PlanStop, item: PlanItem, enabled: boolean): State {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!enabled) {
      setState({ status: "idle" });
      return;
    }
    if (stop.latitude === undefined || stop.longitude === undefined) {
      setState({ status: "failed" });
      return;
    }
    let active = true;
    setState({ status: "loading" });
    productsClient
      .nearbyPrices({
        productId: item.productId,
        ...(item.productVariantId ? { productVariantId: item.productVariantId } : {}),
        latitude: stop.latitude,
        longitude: stop.longitude,
        excludeBranchId: stop.storeBranchId,
      })
      .then(({ options }) => active && setState({ status: "ready", options }))
      .catch(() => active && setState({ status: "failed" }));
    return () => {
      active = false;
    };
  }, [enabled, stop.latitude, stop.longitude, stop.storeBranchId, item.productId, item.productVariantId]);

  return state;
}