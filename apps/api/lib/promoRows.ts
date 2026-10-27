import { prisma } from "@depaso/database";

type PromoRecord = Awaited<ReturnType<typeof prisma.paymentPromo.findMany>>[number];

/** Promo con sus medios de pago y días ya convertidos a arrays. */
export type PromoRow = PromoRecord & { methodSlugs: string[]; daysOfWeek: number[] };

export async function loadActivePromos(): Promise<PromoRow[]> {
  const promos = await prisma.paymentPromo.findMany({
    where: { active: true },
    include: { methods: true, days: true },
  });
  return promos.map(({ methods, days, ...promo }) => ({
    ...promo,
    methodSlugs: methods.map((m) => m.methodSlug),
    daysOfWeek: days.map((d) => d.dayOfWeek),
  }));
}
