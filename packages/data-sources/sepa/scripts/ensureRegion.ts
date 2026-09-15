import { prisma } from "@depaso/database";
import { MAR_DEL_PLATA_REGION } from "../src/regions";

/** Upsert de la config de región (sección 62 — vive en DB, no hardcodeada en el pipeline). */
export async function ensureMarketRegion() {
  return prisma.marketRegion.upsert({
    where: { slug: MAR_DEL_PLATA_REGION.slug },
    create: { ...MAR_DEL_PLATA_REGION, enabled: true },
    update: { ...MAR_DEL_PLATA_REGION },
  });
}
