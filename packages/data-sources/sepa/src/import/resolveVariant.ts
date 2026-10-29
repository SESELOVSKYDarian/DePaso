import { prisma } from "@depaso/database";
import { classifyProductType } from "@depaso/domain";
import { normalizeProductName } from "../normalize";
import { extractUnitFromDescription, UNCATEGORIZED_LABEL } from "../productParsing";
import type { ProductoRow } from "../rows";

/**
 * Busca la variante del producto o la crea, y devuelve su id.
 * EAN confirmado (checksum válido) tiene prioridad para unificar variantes entre comercios
 * (sección 8/7). Sin EAN confiable, se cae a nombre normalizado — con el riesgo de
 * duplicados que la propia sección 8 anticipa; no hay forma de eliminarlo del todo sin más
 * inversión en matching (fuera de alcance de esta fase).
 */
export async function resolveProductVariant(producto: ProductoRow, eanConfirmed: boolean): Promise<string> {
  const normalizedName = normalizeProductName(producto.descripcion);

  // ya existe: la reutilizo
  if (eanConfirmed) {
    const existing = await prisma.productVariant.findUnique({ where: { ean: producto.productosEan } });
    if (existing) return existing.id;
  } else {
    const existingByName = await prisma.productVariant.findFirst({ where: { product: { normalizedName } } });
    if (existingByName) return existingByName.id;
  }

  // no existe: creo marca (si trae una real), producto y variante
  const { unit, unitSize } = extractUnitFromDescription(producto.descripcion);
  const hasBrand = producto.marca && producto.marca.trim().toLowerCase() !== "sin marca";
  const brand = hasBrand
    ? await prisma.brand.upsert({ where: { name: producto.marca }, create: { name: producto.marca }, update: {} })
    : null;

  const product = await prisma.product.create({
    data: {
      name: producto.descripcion,
      normalizedName,
      category: UNCATEGORIZED_LABEL,
      productType: classifyProductType(producto.descripcion),
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
