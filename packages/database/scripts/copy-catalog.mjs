/**
 * Copia el catálogo (regiones, comercios, sucursales, productos, precios) de una base a otra,
 * por lotes. Sirve para poblar la base de producción con lo que ya se importó de SEPA en la
 * base local, en vez de re-importar fila por fila por la red.
 *
 * No borra nada y es idempotente. Si una fila ya existe en el destino con OTRO id (misma
 * región, marca, sucursal o EAN que dejó un import previo), no se duplica: se reutiliza la
 * existente y las filas hijas se re-apuntan a ella. No toca usuarios ni listas.
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

/** idMaps[modelo]: id en origen -> id en destino, sólo para filas que ya existían con otro id. */
const idMaps = {};
const remap = (model, id) => (id == null ? id : (idMaps[model]?.get(id) ?? id));
const setMap = (model, localId, targetId) => {
  if (localId === targetId) return;
  (idMaps[model] ??= new Map()).set(localId, targetId);
};

async function existingIds(model, ids) {
  if (ids.length === 0) return new Set();
  const rows = await target[model].findMany({ where: { id: { in: ids } }, select: { id: true } });
  return new Set(rows.map((r) => r.id));
}

/** Quita las filas cuyo padre no existe en el destino (después de re-apuntar por idMaps). */
async function keepRowsWithParents(rows, parents = []) {
  let kept = rows;
  for (const [field, parentModel] of parents) {
    const ids = [...new Set(kept.map((r) => r[field]).filter((v) => v != null))];
    const present = await existingIds(parentModel, ids);
    kept = kept.filter((r) => r[field] == null || present.has(r[field]));
  }
  return kept;
}

/**
 * Cada paso puede definir:
 *  - fks: campos FK a re-apuntar [campo, modeloPadre]
 *  - dedupe(rows): devuelve las filas a insertar y registra en idMaps las que ya existen
 *  - transform(row): ajuste final
 */
const steps = [
  {
    model: "marketRegion",
    async dedupe(rows) {
      const found = await target.marketRegion.findMany({ where: { slug: { in: rows.map((r) => r.slug) } } });
      const bySlug = new Map(found.map((r) => [r.slug, r.id]));
      return rows.filter((r) => {
        const existing = bySlug.get(r.slug);
        if (existing) setMap("marketRegion", r.id, existing);
        return !existing;
      });
    },
  },
  {
    model: "storeCompany",
    async dedupe(rows) {
      const found = await target.storeCompany.findMany({ where: { cuit: { in: rows.map((r) => r.cuit) } } });
      const byCuit = new Map(found.map((r) => [r.cuit, r.id]));
      return rows.filter((r) => {
        const existing = byCuit.get(r.cuit);
        if (existing) setMap("storeCompany", r.id, existing);
        return !existing;
      });
    },
  },
  {
    model: "store",
    fks: [["companyId", "storeCompany"]],
    async dedupe(rows) {
      const keyOf = (r) => `${r.companyId}|${r.externalSepaBrandId}`;
      const withSepa = rows.filter((r) => r.companyId && r.externalSepaBrandId);
      const found = withSepa.length
        ? await target.store.findMany({
            where: {
              OR: withSepa.map((r) => ({ companyId: r.companyId, externalSepaBrandId: r.externalSepaBrandId })),
            },
          })
        : [];
      const byKey = new Map(found.map((r) => [keyOf(r), r.id]));
      return rows.filter((r) => {
        if (!r.companyId || !r.externalSepaBrandId) return true;
        const existing = byKey.get(keyOf(r));
        if (existing) setMap("store", r.id, existing);
        return !existing;
      });
    },
  },
  { model: "storeAlias", fks: [["storeId", "store"]] },
  {
    model: "storeBranch",
    fks: [
      ["storeId", "store"],
      ["marketRegionId", "marketRegion"],
    ],
    async dedupe(rows) {
      const keyOf = (r) => `${r.externalSepaCommerceId}|${r.externalSepaBrandId}|${r.externalSepaBranchId}`;
      const withSepa = rows.filter((r) => r.externalSepaCommerceId && r.externalSepaBrandId && r.externalSepaBranchId);
      const found = withSepa.length
        ? await target.storeBranch.findMany({
            where: {
              OR: withSepa.map((r) => ({
                externalSepaCommerceId: r.externalSepaCommerceId,
                externalSepaBrandId: r.externalSepaBrandId,
                externalSepaBranchId: r.externalSepaBranchId,
              })),
            },
          })
        : [];
      const byKey = new Map(found.map((r) => [keyOf(r), r.id]));
      return rows.filter((r) => {
        const existing = byKey.get(keyOf(r));
        if (existing) setMap("storeBranch", r.id, existing);
        return !existing;
      });
    },
    transform: (row) => ({ ...row, ownerUserId: null, openingHours: row.openingHours ?? Prisma.DbNull }),
  },
  {
    model: "brand",
    async dedupe(rows) {
      const found = await target.brand.findMany({ where: { name: { in: rows.map((r) => r.name) } } });
      const byName = new Map(found.map((r) => [r.name, r.id]));
      return rows.filter((r) => {
        const existing = byName.get(r.name);
        if (existing) setMap("brand", r.id, existing);
        return !existing;
      });
    },
  },
  {
    model: "product",
    fks: [["brandId", "brand"]],
    /** Un producto cuya variante (por EAN) ya existe en el destino no se duplica. */
    async dedupe(rows) {
      const variants = await source.productVariant.findMany({
        where: { productId: { in: rows.map((r) => r.id) }, ean: { not: null } },
        select: { productId: true, ean: true },
      });
      const eans = variants.map((v) => v.ean);
      const found = eans.length
        ? await target.productVariant.findMany({ where: { ean: { in: eans } }, select: { ean: true, productId: true } })
        : [];
      const productByEan = new Map(found.map((v) => [v.ean, v.productId]));
      const skip = new Map();
      for (const v of variants) {
        const existing = productByEan.get(v.ean);
        if (existing) skip.set(v.productId, existing);
      }
      return rows.filter((r) => {
        const existing = skip.get(r.id);
        if (existing) setMap("product", r.id, existing);
        return !existing;
      });
    },
  },
  {
    model: "productVariant",
    fks: [["productId", "product"]],
    async dedupe(rows) {
      const eans = rows.map((r) => r.ean).filter(Boolean);
      const found = eans.length
        ? await target.productVariant.findMany({ where: { ean: { in: eans } }, select: { id: true, ean: true } })
        : [];
      const byEan = new Map(found.map((v) => [v.ean, v.id]));
      return rows.filter((r) => {
        const existing = r.ean ? byEan.get(r.ean) : null;
        if (existing) setMap("productVariant", r.id, existing);
        return !existing;
      });
    },
  },
  { model: "productAlias", fks: [["productVariantId", "productVariant"]] },
  {
    model: "price",
    fks: [
      ["productVariantId", "productVariant"],
      ["storeBranchId", "storeBranch"],
    ],
    /** Un precio (variante+sucursal) que ya existe en el destino no se duplica. */
    async dedupe(rows) {
      const found = await target.price.findMany({
        where: { productVariantId: { in: [...new Set(rows.map((r) => r.productVariantId))] } },
        select: { productVariantId: true, storeBranchId: true },
      });
      const have = new Set(found.map((p) => `${p.productVariantId}|${p.storeBranchId}`));
      return rows.filter((r) => !have.has(`${r.productVariantId}|${r.storeBranchId}`));
    },
  },
];

async function copyModel({ model, fks = [], dedupe, transform }) {
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
    cursor = rows[rows.length - 1].id;
    seen += rows.length;

    let batch = rows.map((r) => {
      const copy = { ...r };
      for (const [field, parentModel] of fks) copy[field] = remap(parentModel, copy[field]);
      return copy;
    });
    if (dedupe) batch = await dedupe(batch);
    batch = await keepRowsWithParents(batch, fks);
    if (batch.length > 0) {
      const result = await target[model].createMany({
        data: transform ? batch.map(transform) : batch,
        skipDuplicates: true,
      });
      inserted += result.count;
    }
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
