/**
 * Copia el catálogo (regiones, comercios, sucursales, productos, precios) de una base a otra,
 * por lotes. Sirve para poblar la base de producción con lo que ya se importó de SEPA en la
 * base local, en vez de re-importar fila por fila por la red. No borra nada: es idempotente
 * (`skipDuplicates`) y omite las filas cuyo padre no llegó a la base destino (por ejemplo
 * porque ya existía con otro id). No toca usuarios ni listas.
 *
 *   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... node packages/database/scripts/copy-catalog.mjs
 */
import { Prisma, PrismaClient } from "@prisma/client";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;
if (!sourceUrl || !targetUrl) {
  console.error("Faltan SOURCE_DATABASE_URL y/o TARGET_DATABASE_URL.");
  process.exit(1);
}

const source = new PrismaClient({ datasourceUrl: sourceUrl });
const target = new PrismaClient({ datasourceUrl: targetUrl });

const BATCH = 3000;

/**
 * En orden de dependencias. `parents` lista [campo FK, modelo padre] que deben existir en el
 * destino; `transform` ajusta cada fila.
 */
const steps = [
  { model: "marketRegion" },
  { model: "storeCompany" },
  { model: "store", parents: [["companyId", "storeCompany"]] },
  { model: "storeAlias", parents: [["storeId", "store"]] },
  {
    model: "storeBranch",
    parents: [
      ["storeId", "store"],
      ["marketRegionId", "marketRegion"],
    ],
    transform: (row) => ({ ...row, ownerUserId: null, openingHours: row.openingHours ?? Prisma.DbNull }),
  },
  { model: "brand" },
  { model: "product", parents: [["brandId", "brand"]] },
  { model: "productVariant", parents: [["productId", "product"]] },
  { model: "productAlias", parents: [["productVariantId", "productVariant"]] },
  {
    model: "price",
    parents: [
      ["productVariantId", "productVariant"],
      ["storeBranchId", "storeBranch"],
    ],
  },
];

async function existingIds(model, ids) {
  if (ids.length === 0) return new Set();
  const rows = await target[model].findMany({ where: { id: { in: ids } }, select: { id: true } });
  return new Set(rows.map((r) => r.id));
}

async function keepRowsWithParents(rows, parents = []) {
  let kept = rows;
  for (const [field, parentModel] of parents) {
    const ids = [...new Set(kept.map((r) => r[field]).filter((v) => v != null))];
    const present = await existingIds(parentModel, ids);
    kept = kept.filter((r) => r[field] == null || present.has(r[field]));
  }
  return kept;
}

async function copyModel({ model, parents, transform }) {
  const total = await source[model].count();
  let seen = 0;
  let inserted = 0;
  let cursor;
  for (;;) {
    const rows = await source[model].findMany({
      take: BATCH,
      orderBy: { id: "asc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;
    const kept = await keepRowsWithParents(rows, parents);
    if (kept.length > 0) {
      const result = await target[model].createMany({
        data: transform ? kept.map(transform) : kept,
        skipDuplicates: true,
      });
      inserted += result.count;
    }
    seen += rows.length;
    cursor = rows[rows.length - 1].id;
    process.stdout.write(`\r${model}: ${seen}/${total} (nuevas: ${inserted})`);
  }
  process.stdout.write(`\r${model}: ${seen}/${total} (nuevas: ${inserted}) OK\n`);
}

try {
  for (const step of steps) {
    await copyModel(step);
  }
} finally {
  await source.$disconnect();
  await target.$disconnect();
}
