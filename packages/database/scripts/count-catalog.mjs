/** Cuenta filas del catálogo de la base indicada por DATABASE_URL (chequeo rápido). */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const [products, variants, stores, branches, prices, promos] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.store.count(),
    prisma.storeBranch.count(),
    prisma.price.count(),
    prisma.price.count({ where: { promoDescription1: { not: null } } }),
  ]);
  console.log({ products, variants, stores, branches, prices, promos });
} finally {
  await prisma.$disconnect();
}
