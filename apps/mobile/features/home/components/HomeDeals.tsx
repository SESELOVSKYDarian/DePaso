import type { HomeFeedResponse, HomeProduct } from "@depaso/validation";
import { ProductStrip } from "./ProductStrip";
import { TopAds } from "./HomeAds";

interface HomeDealsProps {
  feed: HomeFeedResponse | null;
  onAdd: (product: HomeProduct) => void;
}

/** Lo que más llama la atención de Inicio: publicidad de comercios, destacados y lo barato de hoy. */
export function HomeDeals({ feed, onAdd }: HomeDealsProps) {
  return (
    <>
      <TopAds ads={feed?.ads ?? []} />
      {feed && feed.featured.length > 0 ? (
        <ProductStrip title="Destacados" subtitle="Publicidad de comercios de tu zona." products={feed.featured} onAdd={onAdd} />
      ) : null}
      <ProductStrip
        title="Barato hoy"
        subtitle="Productos con el precio más bajo comparado con el resto."
        products={feed ? feed.cheapToday : null}
        showSaving
        onAdd={onAdd}
      />
    </>
  );
}