import { prisma } from "@depaso/database";
import { isValidGtinChecksum } from "../normalize";
import type { ProductoRow } from "../rows";
import { resolveProductVariant } from "./resolveVariant";

const PRICE_SOURCE_TYPE = "OFFICIAL_SEPA" as const;

/** Identificador estable de un precio de SEPA: comercio | bandera | sucursal | producto. */
function buildSourceExternalId(row: Pick<ProductoRow, "idComercio" | "idBandera" | "idSucursal" | "idProducto">): string {
  return `${row.idComercio}|${row.idBandera}|${row.idSucursal}|${row.idProducto}`;
}

/** Datos de las promociones que trae SEPA, iguales al crear y al actualizar. */
function promoFields(producto: ProductoRow) {
  return {
    promoPrice1: producto.promo1Precio,
    promoDescription1: producto.promo1Leyenda,
    promoPrice2: producto.promo2Precio,
    promoDescription2: producto.promo2Leyenda,
  };
}

/**
 * Guarda el precio de un producto en una sucursal:
 *  - si no existía, lo crea;
 *  - si cambió, lo actualiza y deja el valor anterior en `PriceHistory`;
 *  - si es igual, solo marca que se vio hoy;
 *  - si lo editó el comercio en DePaso, no lo toca (manda sobre SEPA).
 */
export async function savePrice(producto: ProductoRow, branchId: string, price: number, resourceId: string): Promise<void> {
  const sourceExternalId = buildSourceExternalId(producto);
  const existing = await prisma.price.findFirst({ where: { sourceExternalId } });

  if (existing?.sourceType === "MERCHANT") return;

  if (!existing) {
    const productVariantId = await resolveProductVariant(producto, isValidGtinChecksum(producto.productosEan));
    await prisma.price.create({
      data: {
        productVariantId,
        storeBranchId: branchId,
        price,
        sourceType: PRICE_SOURCE_TYPE,
        sourceReference: resourceId,
        sourceExternalId,
        ...promoFields(producto),
        confidence: "HIGH",
        status: "VERIFIED",
      },
    });
    return;
  }

  if (Number(existing.price) === price) {
    await prisma.price.update({ where: { id: existing.id }, data: { reportedAt: new Date() } });
    return;
  }

  await prisma.$transaction([
    prisma.price.update({
      where: { id: existing.id },
      data: { price, ...promoFields(producto), reportedAt: new Date() },
    }),
    prisma.priceHistory.create({
      data: {
        priceId: existing.id,
        amount: existing.price,
        status: existing.status,
        changeReason: "Actualización automática — import SEPA",
      },
    }),
  ]);
}
