import { prisma } from "@depaso/database";
import type { ImportSourceType } from "@depaso/database";
import { normalizeProductName } from "../normalize";
import type { ComercioRow } from "../rows";

/** Guarda la empresa (por CUIT) y su bandera (Vea, Disco...) y devuelve el id de la bandera. */
export async function saveStore(row: ComercioRow, source: ImportSourceType): Promise<string> {
  const company = await prisma.storeCompany.upsert({
    where: { cuit: row.cuit },
    create: { cuit: row.cuit, legalName: row.razonSocial, source, sourceUpdatedAt: row.ultimaActualizacion },
    update: { legalName: row.razonSocial, sourceUpdatedAt: row.ultimaActualizacion },
  });
  const normalizedName = normalizeProductName(row.banderaNombre);
  const store = await prisma.store.upsert({
    where: { companyId_externalSepaBrandId: { companyId: company.id, externalSepaBrandId: row.idBandera } },
    create: { name: row.banderaNombre, companyId: company.id, externalSepaBrandId: row.idBandera, normalizedName },
    update: { name: row.banderaNombre, normalizedName },
  });
  return store.id;
}
