/**
 * Copia el catálogo (marcas, productos, comercios, sucursales, precios e histórico) desde una
 * base PostgreSQL vieja hacia la base MySQL actual. No copia usuarios ni sus datos.
 *
 *   SOURCE_DATABASE_URL="postgresql://..."  DATABASE_URL="mysql://..."  \
 *     pnpm --filter @depaso/database run migrate:from-postgres
 *
 * Se puede volver a correr: lo que ya está cargado se saltea.
 */
import pg from "pg";
import { Prisma, prisma } from "../src";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
if (!sourceUrl) throw new Error("Falta SOURCE_DATABASE_URL (la base PostgreSQL de origen).");

const BATCH = 1000;
// orden por dependencias (primero lo que otros referencian)
const MODELS = [
  "Brand",
  "Product",
  "ProductVariant",
  "ProductAlias",
  "StoreCompany",
  "Store",
  "StoreAlias",
  "StoreBranch",
  "Price",
  "PriceHistory",
] as const;

type Row = Record<string, unknown>;
const source = new pg.Client({ connectionString: sourceUrl });

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Deja solo las columnas que existen en la tabla de destino. */
function pickColumns(row: Row, columns: Set<string>): Row {
  const out: Row = {};
  for (const key of Object.keys(row)) if (columns.has(key)) out[key] = row[key];
  return out;
}

/** Regiones del origen que faltan en el destino se crean; devuelve id viejo -> id nuevo. */
async function regionIdMap(): Promise<Map<string, string>> {
  const { rows } = await source.query<Row>('SELECT * FROM market_regions');
  const map = new Map<string, string>();
  for (const old of rows) {
    let current = await prisma.marketRegion.findUnique({ where: { slug: old.slug as string } });
    if (!current) {
      // MySQL ignora mayúsculas: una sola fila por alias
      const aliases = [...new Map(((old.localityAliases as string[]) ?? []).map((a) => [a.toLowerCase(), a])).values()];
      current = await prisma.marketRegion.create({
        data: {
          id: old.id as string,
          slug: old.slug as string,
          name: old.name as string,
          province: old.province as string,
          country: old.country as string,
          enabled: old.enabled as boolean,
          minLatitude: old.minLatitude as number,
          maxLatitude: old.maxLatitude as number,
          minLongitude: old.minLongitude as number,
          maxLongitude: old.maxLongitude as number,
          localities: { create: aliases.map((alias) => ({ alias })) },
        },
      });
    }
    map.set(old.id as string, current.id);
  }
  return map;
}

async function insertBatch(delegate: any, model: string, data: Row[]): Promise<number> {
  try {
    const result = await delegate.createMany({ data, skipDuplicates: true });
    return result.count as number;
  } catch {
    // si falla el lote, pruebo fila por fila para no perder las buenas
    let ok = 0;
    for (const row of data) {
      try {
        await delegate.createMany({ data: [row], skipDuplicates: true });
        ok += 1;
      } catch (error) {
        console.warn(`  ${model}: fila omitida (${(error as Error).message.split("\n").pop()})`);
      }
    }
    return ok;
  }
}

async function copyModel(model: (typeof MODELS)[number], regions: Map<string, string>, extra: Set<string>) {
  const info = Prisma.dmmf.datamodel.models.find((m) => m.name === model)!;
  const table = info.dbName ?? model;
  const columns = new Set(info.fields.filter((f) => f.kind !== "object").map((f) => f.name));
  const delegate = (prisma as any)[lowerFirst(model)];

  const total = Number((await source.query(`SELECT count(*) FROM "${table}"`)).rows[0].count);
  console.log(`${table}: ${total} filas`);
  let done = 0;
  let copied = 0;

  let lastId = "";
  while (done < total) {
    // paginado por id (más rápido que OFFSET en tablas grandes)
    const { rows } = await source.query<Row>(`SELECT * FROM "${table}" WHERE "id" > $1 ORDER BY "id" LIMIT ${BATCH}`, [lastId]);
    if (rows.length === 0) break;
    lastId = rows[rows.length - 1]!.id as string;
    const data: Row[] = [];
    const hours: Row[] = [];

    for (const row of rows) {
      if (model === "StoreBranch") {
        row.marketRegionId = row.marketRegionId ? regions.get(row.marketRegionId as string) ?? null : null;
        row.ownerUserId = null; // los usuarios no se copian
        // los horarios pasan a su propia tabla
        const opening = row.openingHours as Record<string, string> | null;
        for (const [day, text] of Object.entries(opening ?? {})) {
          hours.push({ branchId: row.id, day, hours: String(text) });
        }
      }
      data.push(pickColumns(row, columns));
    }

    copied += await insertBatch(delegate, model, data);
    if (hours.length > 0) await insertBatch(prisma.storeBranchHours, "StoreBranchHours", hours);
    done += rows.length;
    process.stdout.write(`  ${done}/${total}\r`);
  }
  console.log(`  ${table}: ${copied} copiadas, ${total - copied} ya estaban o se omitieron`);
  extra.add(table);
}

async function main() {
  await source.connect();
  const regions = await regionIdMap();
  if (regions.size === 0) {
    console.warn("Aviso: el origen no tiene regiones; las sucursales quedan sin región.");
  }
  const seen = new Set<string>();
  for (const model of MODELS) await copyModel(model, regions, seen);
  console.log("Listo.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.end();
    await prisma.$disconnect();
  });
