import type { HomeFeedResponse } from "@depaso/validation";
import { PriceChanges } from "./PriceChanges";
import { PromosToday } from "./PromosToday";

/** Lo que cambió: precios de tus listas y promos del día. */
export function HomeNews({ feed }: { feed: HomeFeedResponse | null }) {
  return (
    <>
      <PriceChanges changes={feed?.priceChanges ?? []} />
      <PromosToday promos={feed?.promos ?? []} />
    </>
  );
}