/** Lista las leyendas de promo más frecuentes de la base indicada por DATABASE_URL. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const rows = await prisma.price.groupBy({
    by: ["promoDescription1"],
    where: { promoDescription1: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { promoDescription1: "desc" } },
    take: 40,
  });
  for (const row of rows) console.log(row._count._all, "|", row.promoDescription1);
} finally {
  await prisma.$disconnect();
}
