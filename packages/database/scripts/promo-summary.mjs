/** Resume las promos activas (comercio, medios de pago, %, tope, días) de la base indicada por DATABASE_URL. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const promos = await prisma.paymentPromo.findMany({ where: { active: true }, orderBy: { retailer: "asc" } });
  for (const p of promos) {
    console.log(
      `${p.retailer} | ${p.methodSlugs.join(",") || "(sin medio)"} | ${p.discountPercent}% | tope ${p.capAmount ?? "-"} | días ${p.daysOfWeek.join(",") || "todos"}`
    );
  }
  console.log(`total activas: ${promos.length}`);
} finally {
  await prisma.$disconnect();
}
