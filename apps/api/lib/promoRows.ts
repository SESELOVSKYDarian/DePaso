import { prisma } from "@depaso/database";
import { asNumberArray, asStringArray } from "./jsonArrays";

type PromoRecord = Awaited<ReturnType<typeof prisma.paymentPromo.findMany>>[number];

/** Promo con las listas ya convertidas de JSON a arrays tipados. */
export type PromoRow = Omit<PromoRecord, "methodSlugs" | "daysOfWeek"> & { methodSlugs: string[]; daysOfWeek: number[] };

export async function loadActivePromos(): Promise<PromoRow[]> {
  const promos = await prisma.paymentPromo.findMany({ where: { active: true } });
  return promos.map((promo) => ({
    ...promo,
    methodSlugs: asStringArray(promo.methodSlugs),
    daysOfWeek: asNumberArray(promo.daysOfWeek),
  }));
}
