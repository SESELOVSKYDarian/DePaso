import { prisma } from "@depaso/database";
import { AD_PRICE_PER_DAY, type AdPrices } from "@depaso/validation";

/** Precios base por día vigentes: lo que fijó el administrador y, donde no fijó nada, los de fábrica. */
export async function loadAdPrices(): Promise<AdPrices> {
  const rows = await prisma.adPrice.findMany();
  const prices: AdPrices = { ...AD_PRICE_PER_DAY };
  for (const row of rows) prices[row.kind] = row.pricePerDay;
  return prices;
}
