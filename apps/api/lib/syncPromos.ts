import { prisma } from "@depaso/database";
import { normalizeSourcePromo, type SourcePromo } from "./paymentPromos";

const DATASET_URL = "https://raw.githubusercontent.com/paprikacc/promos-argentina/main/data/promos.json";

/**
 * Sincroniza `PaymentPromo` desde el dataset abierto de promos bancarias (MIT, actualizado a
 * diario). Descarta lo que no es confiable (ver `normalizeSourcePromo`) y desactiva las promos
 * que ya no figuran en la fuente, sin borrarlas.
 */
export async function syncPaymentPromos(): Promise<{ fetched: number; accepted: number; discarded: number }> {
  const response = await fetch(DATASET_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Dataset de promos -> HTTP ${response.status}`);
  const json = (await response.json()) as { promociones?: SourcePromo[] };
  const source = json.promociones ?? [];

  const accepted = source.flatMap((promo) => {
    const normalized = normalizeSourcePromo(promo);
    return normalized ? [normalized] : [];
  });

  const syncedAt = new Date();
  for (const promo of accepted) {
    await prisma.paymentPromo.upsert({
      where: { externalId: promo.externalId },
      create: { ...promo, active: true, syncedAt },
      update: { ...promo, active: true, syncedAt },
    });
  }
  await prisma.paymentPromo.updateMany({
    where: { syncedAt: { lt: syncedAt } },
    data: { active: false },
  });

  return { fetched: source.length, accepted: accepted.length, discarded: source.length - accepted.length };
}
