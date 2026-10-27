import { prisma } from "@depaso/database";
import { MAR_DEL_PLATA_REGION } from "../src/regions";

/** Upsert de la config de región (sección 62 — vive en DB, no hardcodeada en el pipeline). */
export async function ensureMarketRegion() {
  const { localityAliases, ...fields } = MAR_DEL_PLATA_REGION;
  // la colación de MySQL ignora mayúsculas: "MAR DEL PLATA" y "Mar del Plata" son la misma fila
  const unique = [...new Map(localityAliases.map((alias) => [alias.toLowerCase(), alias])).values()];
  const localities = unique.map((alias) => ({ alias }));

  const region = await prisma.marketRegion.upsert({
    where: { slug: fields.slug },
    create: { ...fields, enabled: true, localities: { create: localities } },
    update: { ...fields, localities: { deleteMany: {}, create: localities } },
    include: { localities: true },
  });
  const { localities: saved, ...rest } = region;
  return { ...rest, localityAliases: saved.map((l: { alias: string }) => l.alias) };
}
