import { prisma } from "@depaso/database";
import type { ImportSourceType } from "@depaso/database";
import type { MarketRegionConfig } from "@depaso/geo";
import type { SucursalRow } from "../rows";

interface SaveBranchInput {
  sucursal: SucursalRow;
  storeId: string;
  source: ImportSourceType;
  region: MarketRegionConfig & { id: string };
  /** `true` si las coordenadas del feed y la localidad se contradicen */
  hasDiscrepancy: boolean;
}

/**
 * Guarda una sucursal (la crea o la actualiza), sus horarios y, si hace falta, deja anotados
 * los problemas de datos (coordenadas que no coinciden con la localidad o que faltan).
 * Devuelve el id de la sucursal.
 */
export async function saveBranch({ sucursal, storeId, source, region, hasDiscrepancy }: SaveBranchInput): Promise<string> {
  const address = [sucursal.calle, sucursal.numero].filter(Boolean).join(" ");

  // `StoreBranch.latitude/longitude` no pueden ser nulas (el motor de optimización asume que
  // siempre hay coordenadas), pero SEPA trae la longitud vacía seguido. En vez de guardar `0`
  // (cae frente a la costa de África: un dato falso peor que ninguno) se usa el centro de la
  // región como aproximación explícita y se deja un `BranchDataIssue` para corregirla.
  const centerLatitude = (region.minLatitude + region.maxLatitude) / 2;
  const centerLongitude = (region.minLongitude + region.maxLongitude) / 2;
  const hasMissingCoordinates = sucursal.latitude === null || sucursal.longitude === null;

  const common = {
    name: sucursal.nombre,
    address,
    street: sucursal.calle || null,
    streetNumber: sucursal.numero || null,
    postalCode: sucursal.codigoPostal,
    sourceUpdatedAt: new Date(),
    status: "ACTIVE" as const,
    marketRegionId: region.id,
  };

  const branch = await prisma.storeBranch.upsert({
    where: {
      externalSepaCommerceId_externalSepaBrandId_externalSepaBranchId: {
        externalSepaCommerceId: sucursal.idComercio,
        externalSepaBrandId: sucursal.idBandera,
        externalSepaBranchId: sucursal.idSucursal,
      },
    },
    create: {
      ...common,
      storeId,
      latitude: sucursal.latitude ?? centerLatitude,
      longitude: sucursal.longitude ?? centerLongitude,
      externalSepaCommerceId: sucursal.idComercio,
      externalSepaBrandId: sucursal.idBandera,
      externalSepaBranchId: sucursal.idSucursal,
      source,
    },
    update: {
      ...common,
      ...(sucursal.latitude !== null ? { latitude: sucursal.latitude } : {}),
      ...(sucursal.longitude !== null ? { longitude: sucursal.longitude } : {}),
    },
  });

  // horarios por día en su propia tabla: se reemplazan por los del feed
  await prisma.storeBranchHours.deleteMany({ where: { branchId: branch.id } });
  const hours = Object.entries(sucursal.openingHours).map(([day, text]) => ({ branchId: branch.id, day, hours: text }));
  if (hours.length > 0) await prisma.storeBranchHours.createMany({ data: hours });

  // Sección 43 — coordenadas y localidad se contradicen: registrar, no decidir en silencio cuál "gana".
  if (hasDiscrepancy) {
    await prisma.branchDataIssue.create({
      data: {
        storeBranchId: branch.id,
        type: "GEO_DISCREPANCY",
        detail: `lat/lon (${sucursal.latitude},${sucursal.longitude}) vs localidad "${sucursal.localidad}" no coinciden con la región ${region.slug}`,
      },
    });
  }
  if (hasMissingCoordinates) {
    await prisma.branchDataIssue.create({
      data: {
        storeBranchId: branch.id,
        type: "MISSING_COORDINATES",
        detail: `SEPA no publicó lat/lon completas (lat=${sucursal.latitude}, lon=${sucursal.longitude}) — se usó el centro de ${region.slug} como aproximación. Geocodificar la dirección real (sección 42).`,
      },
    });
  }

  return branch.id;
}
