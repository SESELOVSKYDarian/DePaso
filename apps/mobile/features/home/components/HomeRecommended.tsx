import type { HomeFeedResponse, HomeProduct } from "@depaso/validation";
import { BottomBanners } from "./HomeAds";
import { ProductStrip } from "./ProductStrip";

interface HomeRecommendedProps {
  feed: HomeFeedResponse | null;
  onAdd: (product: HomeProduct) => void;
}

/** Los productos más buscados y, al final, los banners de los comercios. */
export function HomeRecommended({ feed, onAdd }: HomeRecommendedProps) {
  return (
    <>
      <ProductStrip
        title="Recomendados"
        subtitle="Lo que más se busca, con su mejor precio."
        products={feed ? feed.popular : null}
        onAdd={onAdd}
      />
      <BottomBanners ads={feed?.ads ?? []} />
    </>
  );
}