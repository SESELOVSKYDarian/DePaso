import { prisma } from "@depaso/database";
import type { ImportSourceType } from "@depaso/database";
import { createGeoScopeService, type MarketRegionConfig } from "@depaso/geo";
import { iterateSepaDailyArchive } from "./archive";
import { createCkanClient, SEPA_PACKAGE_IDS } from "./ckan";
import { downloadResource } from "./download";
import { isValidGtinChecksum, normalizeProductName } from "./normalize";
import { extractUnitFromDescription, UNCATEGORIZED_LABEL } from "./productParsing";
import { iterateProductosCsv, parseComercioCsv, parseSucursalesCsv, type ProductoRow } from "./rows";

export interface SepaImportOptions {
  source: ImportSourceType;
  /** `MarketRegion` ya cargado de Prisma (id real + config geográfica) — este package no
   * decide cuál región usar, el caller (script CLI) lo resuelve. */
  region: MarketRegionConfig & { id: string };
  dryRun?: boolean;
  /** Máximo de muestras de anomalías a devolver en el resumen (no todas — pueden ser
   * miles); el detalle completo, si `!dryRun`, queda en `ImportAnomaly`. */
  maxAnomalySamples?: number;
}

export interface AnomalySample {
  reason: string;
  sample: string;
}

export interface ChainSummary {
  storeName: string;
  branchesDetected: number;
}

export interface SepaImportSummary {
  source: ImportSourceType;
  resourceId: string;
  resourceLastModified: string;
  dryRun: boolean;
  skippedAlreadyImported: boolean;
  comerciosInFeed: number;
  chains: ChainSummary[];
  branchesDetected: number;
  branchesOutOfScope: number;
  productRowsRead: number;
  pricesAccepted: number;
  pricesRejected: number;
  anomalySamples: AnomalySample[];
}

const PRICE_SOURCE_TYPE = "OFFICIAL_SEPA" as const;

function buildSourceExternalId(row: Pick<ProductoRow, "idComercio" | "idBandera" | "idSucursal" | "idProducto">): string {
  return `${row.idComercio}|${row.idBandera}|${row.idSucursal}|${row.idProducto}`;
}

/**
 * Pipeline de import de SEPA (sección 25, adaptado a la estructura real confirmada en
 * docs/data/SEPA.md — ZIP del día → ZIP anidado por comercio → 3 CSV). Alcance de esta
 * fase: SEPA Mayorista (chico, ~10-15MB/día) — Minorista (~330MB/día) necesita streaming
 * real antes de conectarse acá (sección 26, deliberadamente no implementado todavía).
 *
 * Sección 14: sólo se persisten sucursales/precios dentro de `options.region` — nunca se
 * toca `Product`/`Price` para una fila fuera de scope, ni siquiera para crear el producto.
 */
export async function runSepaImport(options: SepaImportOptions): Promise<SepaImportSummary> {
  const dryRun = options.dryRun ?? false;
  const maxAnomalySamples = options.maxAnomalySamples ?? 30;
  const anomalySamples: AnomalySample[] = [];
  const addAnomaly = (reason: string, sample: string) => {
    if (anomalySamples.length < maxAnomalySamples) anomalySamples.push({ reason, sample });
  };

  const packageId = options.source === "SEPA_MINORISTA" ? SEPA_PACKAGE_IDS.MINORISTA : SEPA_PACKAGE_IDS.MAYORISTA;
  const ckan = createCkanClient();
  const resource = await ckan.getLatestResource(packageId, "ZIP");
  const { buffer, sha256 } = await downloadResource(resource.url);

  const existingRun = await prisma.dataImportRun.findUnique({
    where: { source_fileHash: { source: options.source, fileHash: sha256 } },
  });
  if (existingRun && existingRun.status === "SUCCESS") {
    return {
      source: options.source,
      resourceId: resource.id,
      resourceLastModified: resource.lastModified,
      dryRun,
      skippedAlreadyImported: true,
      comerciosInFeed: 0,
      chains: [],
      branchesDetected: 0,
      branchesOutOfScope: 0,
      productRowsRead: 0,
      pricesAccepted: 0,
      pricesRejected: 0,
      anomalySamples: [],
    };
  }

  const importRun = dryRun
    ? null
    : await prisma.dataImportRun.create({
        data: {
          source: options.source,
          resourceId: resource.id,
          resourceLastModified: new Date(resource.lastModified),
          fileHash: sha256,
          status: "RUNNING",
        },
      });

  const geo = createGeoScopeService(options.region);

  const chains: ChainSummary[] = [];
  let comerciosInFeed = 0;
  let branchesDetected = 0;
  let branchesOutOfScope = 0;
  let productRowsRead = 0;
  let pricesAccepted = 0;
  let pricesRejected = 0;

  // Generador, no array — sección 26/27: un solo comercio de SEPA Minorista puede
  // decodificar a cientos de MB de `productos.csv`; sostener los ~15 comercios del día
  // simultáneamente en memoria produjo un "JavaScript heap out of memory" real (ver
  // docs/development/DECISIONS.md). Procesando de a uno, cada comercio queda disponible
  // para el recolector de basura antes de leer el siguiente.
  for (const archive of iterateSepaDailyArchive(buffer)) {
    comerciosInFeed++;
    if (!archive.comercioCsv) {
      addAnomaly("comercio.csv vacío o ausente", archive.innerZipName);
      continue;
    }
    const { rows: comercioRows } = parseComercioCsv(archive.comercioCsv);
    if (comercioRows.length === 0) {
      addAnomaly("comercio.csv sin filas válidas", archive.innerZipName);
      continue;
    }

    // companyId + externalSepaBrandId -> Store.id, para resolver sucursales/productos de
    // este comercio contra la bandera correcta (una comercio.csv puede traer varias
    // banderas — ej. Cencosud: Vea/Disco/Jumbo, confirmado real).
    const storeIdByBandera = new Map<string, string>();

    for (const row of comercioRows) {
      let storeId: string | undefined;
      if (!dryRun) {
        const company = await prisma.storeCompany.upsert({
          where: { cuit: row.cuit },
          create: { cuit: row.cuit, legalName: row.razonSocial, source: options.source, sourceUpdatedAt: row.ultimaActualizacion },
          update: { legalName: row.razonSocial, sourceUpdatedAt: row.ultimaActualizacion },
        });
        const store = await prisma.store.upsert({
          where: { companyId_externalSepaBrandId: { companyId: company.id, externalSepaBrandId: row.idBandera } },
          create: {
            name: row.banderaNombre,
            companyId: company.id,
            externalSepaBrandId: row.idBandera,
            normalizedName: normalizeProductName(row.banderaNombre),
          },
          update: { name: row.banderaNombre, normalizedName: normalizeProductName(row.banderaNombre) },
        });
        storeId = store.id;
      }
      storeIdByBandera.set(row.idBandera, storeId ?? "dry-run");
      chains.push({ storeName: row.banderaNombre, branchesDetected: 0 });
    }

    if (!archive.sucursalesCsv) {
      addAnomaly("sucursales.csv vacío o ausente", archive.innerZipName);
      continue;
    }
    const { rows: sucursalRows } = parseSucursalesCsv(archive.sucursalesCsv);

    // Sección 14 — whitelist de sucursales dentro de la región ANTES de tocar productos.
    const branchIdBySucursal = new Map<string, string>();

    for (const sucursal of sucursalRows) {
      const classification = geo.classify(sucursal.latitude, sucursal.longitude, sucursal.localidad);
      if (classification.matchedBy === "none") {
        branchesOutOfScope++;
        continue;
      }

      const storeId = storeIdByBandera.get(sucursal.idBandera);
      if (!storeId) {
        addAnomaly(`sucursal de bandera ${sucursal.idBandera} sin comercio.csv correspondiente`, sucursal.idSucursal);
        continue;
      }

      branchesDetected++;
      const chainEntry = chains.find((c) => c.storeName === comercioRows.find((r) => r.idBandera === sucursal.idBandera)?.banderaNombre);
      if (chainEntry) chainEntry.branchesDetected++;

      if (dryRun) {
        branchIdBySucursal.set(sucursal.idSucursal, "dry-run");
        continue;
      }

      const address = [sucursal.calle, sucursal.numero].filter(Boolean).join(" ");
      // `StoreBranch.latitude/longitude` son `Float` no-nullable (decisión de Fase 1, el
      // motor de optimización asume coordenadas siempre presentes) — pero SEPA trae
      // longitud vacía con frecuencia (real, ver docs/data/SEPA.md). En vez de escribir
      // `0` (que cae frente a la costa de África, un dato falso peor que ninguno), se usa
      // el centro de la región como aproximación explícita y se deja `BranchDataIssue`
      // para que alguien la corrija — nunca se inventa una coordenada real.
      const centerLatitude = (options.region.minLatitude + options.region.maxLatitude) / 2;
      const centerLongitude = (options.region.minLongitude + options.region.maxLongitude) / 2;
      const hasMissingCoordinates = sucursal.latitude === null || sucursal.longitude === null;
      const resolvedLatitude = sucursal.latitude ?? centerLatitude;
      const resolvedLongitude = sucursal.longitude ?? centerLongitude;

      const branch = await prisma.storeBranch.upsert({
        where: {
          externalSepaCommerceId_externalSepaBrandId_externalSepaBranchId: {
            externalSepaCommerceId: sucursal.idComercio,
            externalSepaBrandId: sucursal.idBandera,
            externalSepaBranchId: sucursal.idSucursal,
          },
        },
        create: {
          storeId,
          name: sucursal.nombre,
          address,
          latitude: resolvedLatitude,
          longitude: resolvedLongitude,
          city: options.region.name,
          externalSepaCommerceId: sucursal.idComercio,
          externalSepaBrandId: sucursal.idBandera,
          externalSepaBranchId: sucursal.idSucursal,
          street: sucursal.calle || null,
          streetNumber: sucursal.numero || null,
          postalCode: sucursal.codigoPostal,
          province: sucursal.provincia || null,
          openingHours: sucursal.openingHours,
          source: options.source,
          sourceUpdatedAt: new Date(),
          status: "ACTIVE",
          marketRegionId: options.region.id,
        },
        update: {
          name: sucursal.nombre,
          address,
          ...(sucursal.latitude !== null ? { latitude: sucursal.latitude } : {}),
          ...(sucursal.longitude !== null ? { longitude: sucursal.longitude } : {}),
          street: sucursal.calle || null,
          streetNumber: sucursal.numero || null,
          postalCode: sucursal.codigoPostal,
          province: sucursal.provincia || null,
          openingHours: sucursal.openingHours,
          sourceUpdatedAt: new Date(),
          status: "ACTIVE",
          marketRegionId: options.region.id,
        },
      });
      branchIdBySucursal.set(sucursal.idSucursal, branch.id);

      // Sección 43 — coordenadas y localidad se contradicen: registrar, no decidir en
      // silencio cuál "gana".
      if (classification.hasDiscrepancy) {
        await prisma.branchDataIssue.create({
          data: {
            storeBranchId: branch.id,
            type: "GEO_DISCREPANCY",
            detail: `lat/lon (${sucursal.latitude},${sucursal.longitude}) vs localidad "${sucursal.localidad}" no coinciden con la región ${options.region.slug}`,
          },
        });
      }
      if (hasMissingCoordinates) {
        await prisma.branchDataIssue.create({
          data: {
            storeBranchId: branch.id,
            type: "MISSING_COORDINATES",
            detail: `SEPA no publicó lat/lon completas (lat=${sucursal.latitude}, lon=${sucursal.longitude}) — se usó el centro de ${options.region.slug} como aproximación. Geocodificar la dirección real (sección 42).`,
          },
        });
      }
    }

    if (!archive.productosCsv) {
      if (branchIdBySucursal.size > 0) addAnomaly("productos.csv vacío o ausente", archive.innerZipName);
      continue;
    }

    // Generador — sección 14/26: nunca se materializa un array con las filas de un
    // comercio entero (puede ser nacional, millones de filas); se filtra fila por fila
    // contra la whitelist de sucursales de la región ANTES de construir nada más.
    for (const producto of iterateProductosCsv(archive.productosCsv)) {
      productRowsRead++;
      if (!branchIdBySucursal.has(producto.idSucursal)) continue; // fuera de scope, no se procesa (sección 14)

      const price = producto.precio;
      if (price === null || Number.isNaN(price) || price <= 0) {
        pricesRejected++;
        addAnomaly("precio inválido (nulo, NaN o <= 0)", `${producto.descripcion} = ${String(price)}`);
        continue;
      }

      if (dryRun) {
        pricesAccepted++;
        continue;
      }

      const branchId = branchIdBySucursal.get(producto.idSucursal)!;
      const eanConfirmed = isValidGtinChecksum(producto.productosEan);
      const productVariantId = await resolveProductVariant(producto, eanConfirmed);
      const sourceExternalId = buildSourceExternalId(producto);

      const existingPrice = await prisma.price.findFirst({ where: { sourceExternalId } });
      if (existingPrice) {
        const changed = Number(existingPrice.price) !== price;
        if (changed) {
          await prisma.$transaction([
            prisma.price.update({
              where: { id: existingPrice.id },
              data: {
                price,
                promoPrice1: producto.promo1Precio,
                promoDescription1: producto.promo1Leyenda,
                promoPrice2: producto.promo2Precio,
                promoDescription2: producto.promo2Leyenda,
                reportedAt: new Date(),
              },
            }),
            prisma.priceHistory.create({
              data: {
                priceId: existingPrice.id,
                productVariantId: existingPrice.productVariantId,
                storeBranchId: existingPrice.storeBranchId,
                amount: existingPrice.price,
                status: existingPrice.status,
                changeReason: "Actualización automática — import SEPA",
              },
            }),
          ]);
        } else {
          await prisma.price.update({ where: { id: existingPrice.id }, data: { reportedAt: new Date() } });
        }
      } else {
        await prisma.price.create({
          data: {
            productVariantId,
            storeBranchId: branchId,
            price,
            sourceType: PRICE_SOURCE_TYPE,
            sourceReference: resource.id,
            sourceExternalId,
            promoPrice1: producto.promo1Precio,
            promoDescription1: producto.promo1Leyenda,
            promoPrice2: producto.promo2Precio,
            promoDescription2: producto.promo2Leyenda,
            confidence: "HIGH",
            status: "VERIFIED",
          },
        });
      }
      pricesAccepted++;
    }
  }

  if (!dryRun && importRun) {
    await prisma.dataImportRun.update({
      where: { id: importRun.id },
      data: {
        status: pricesRejected > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        rowsRead: productRowsRead,
        rowsAccepted: pricesAccepted,
        rowsRejected: pricesRejected,
        branchesDetected,
      },
    });
    if (anomalySamples.length > 0) {
      await prisma.importAnomaly.createMany({
        data: anomalySamples.map((a) => ({
          importRunId: importRun.id,
          type: a.reason,
          rawRow: a.sample,
          reason: a.reason,
          needsReview: true,
        })),
      });
    }
  }

  // Colapsar cadenas repetidas (una por cada fila de comercio.csv, sección de arriba) en
  // un resumen por bandera.
  const chainsByName = new Map<string, number>();
  for (const c of chains) {
    chainsByName.set(c.storeName, (chainsByName.get(c.storeName) ?? 0) + c.branchesDetected);
  }

  return {
    source: options.source,
    resourceId: resource.id,
    resourceLastModified: resource.lastModified,
    dryRun,
    skippedAlreadyImported: false,
    comerciosInFeed,
    chains: Array.from(chainsByName.entries())
      .map(([storeName, count]) => ({ storeName, branchesDetected: count }))
      .filter((c) => c.branchesDetected > 0)
      .sort((a, b) => b.branchesDetected - a.branchesDetected),
    branchesDetected,
    branchesOutOfScope,
    productRowsRead,
    pricesAccepted,
    pricesRejected,
    anomalySamples,
  };
}

/**
 * EAN confirmado (checksum válido) tiene prioridad para unificar variantes entre comercios
 * (sección 8/7). Sin EAN confiable, se cae a nombre normalizado — con el riesgo de
 * duplicados que la propia sección 8 anticipa; no hay forma de eliminarlo del todo sin más
 * inversión en matching (fuera de alcance de esta fase).
 */
async function resolveProductVariant(producto: ProductoRow, eanConfirmed: boolean): Promise<string> {
  if (eanConfirmed) {
    const existing = await prisma.productVariant.findUnique({ where: { ean: producto.productosEan } });
    if (existing) return existing.id;
  } else {
    const normalized = normalizeProductName(producto.descripcion);
    const existingByName = await prisma.productVariant.findFirst({
      where: { product: { normalizedName: normalized } },
    });
    if (existingByName) return existingByName.id;
  }

  const { unit, unitSize } = extractUnitFromDescription(producto.descripcion);
  const normalizedName = normalizeProductName(producto.descripcion);

  const brand =
    producto.marca && producto.marca.trim().toLowerCase() !== "sin marca"
      ? await prisma.brand.upsert({
          where: { name: producto.marca },
          create: { name: producto.marca },
          update: {},
        })
      : null;

  const product = await prisma.product.create({
    data: {
      name: producto.descripcion,
      normalizedName,
      category: UNCATEGORIZED_LABEL,
      brandId: brand?.id,
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: producto.descripcion,
      ean: eanConfirmed ? producto.productosEan : null,
      eanConfirmed,
      unit,
      unitSize,
      aliases: { create: [{ alias: normalizedName }] },
    },
  });
  return variant.id;
}
