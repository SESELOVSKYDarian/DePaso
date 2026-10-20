/**
 * Completa `Product.productType` para todo el catálogo con `classifyProductType`.
 *
 * Es idempotente: se puede correr las veces que haga falta (después de agregar palabras al
 * diccionario, o tras una importación grande) y sólo toca las filas cuyo tipo cambia.
 *
 *   pnpm data:sepa:backfill-types              # aplica
 *   pnpm data:sepa:backfill-types -- --dry-run # sólo muestra el resumen
 *
 * Usa `DATABASE_URL` del entorno.
 */
import { prisma } from "@depaso/database";
import { PRODUCT_TYPE_LABELS, classifyProductType } from "@depaso/domain";

const BATCH_SIZE = 2000;
const dryRun = process.argv.includes("--dry-run");

async function main() {
  let cursor: string | undefined;
  let total = 0;
  let classified = 0;
  let changed = 0;
  const unknownFirstWords = new Map<string, number>();

  for (;;) {
    const rows = await prisma.product.findMany({
      take: BATCH_SIZE,
      orderBy: { id: "asc" },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, name: true, productType: true },
    });
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1]!.id;

    const idsByType = new Map<string | null, string[]>();
    for (const row of rows) {
      total += 1;
      const type = classifyProductType(row.name);
      if (type) {
        classified += 1;
      } else {
        const first = row.name.trim().toLowerCase().split(/\s+/)[0] ?? "";
        unknownFirstWords.set(first, (unknownFirstWords.get(first) ?? 0) + 1);
      }
      if (type !== row.productType) {
        const bucket = idsByType.get(type) ?? [];
        bucket.push(row.id);
        idsByType.set(type, bucket);
      }
    }

    for (const [type, ids] of idsByType) {
      if (!dryRun) await prisma.product.updateMany({ where: { id: { in: ids } }, data: { productType: type } });
      changed += ids.length;
    }
    process.stdout.write(`\r${total} productos revisados…`);
  }

  console.log(`\n${dryRun ? "[dry-run] " : ""}${total} productos, ${classified} con tipo (${Math.round((classified / total) * 100)} %), ${changed} cambiaron.`);

  const top = [...unknownFirstWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  console.log("\nPalabras más frecuentes SIN tipo (candidatas a sumar al diccionario):");
  for (const [word, count] of top) console.log(`  ${String(count).padStart(6)}  ${word}`);

  if (!dryRun) {
    const groups = await prisma.product.groupBy({ by: ["productType"], _count: { _all: true }, orderBy: { _count: { productType: "desc" } } });
    console.log("\nProductos por tipo:");
    for (const group of groups) {
      const label = group.productType ? (PRODUCT_TYPE_LABELS[group.productType] ?? group.productType) : "(sin tipo)";
      console.log(`  ${String(group._count._all).padStart(6)}  ${label}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
