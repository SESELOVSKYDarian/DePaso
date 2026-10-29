import type { Brand, MerchantRequest, Price, Product, ProductVariant, User } from "@depaso/database";
import { prettifyBrandName, prettifyProductName } from "../catalog/productNames";
import type {
  AdminMerchantRequestResponse,
  MerchantPriceResponse,
  MerchantRequestResponse,
} from "@depaso/validation";

/** Nombre en minúsculas y sin tildes ni espacios de más, para comparar sin errores. */
export function normalizeName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Solicitud de comercio tal como la ve quien la pidió. */
export function toMerchantRequestResponse(request: MerchantRequest): MerchantRequestResponse {
  return {
    id: request.id,
    businessName: request.businessName,
    address: request.address,
    phone: request.phone,
    contactEmail: request.contactEmail,
    note: request.note,
    status: request.status,
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt.toISOString(),
    reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
    storeBranchId: request.storeBranchId,
  };
}

/** Solicitud de comercio para el administrador (con los datos de quien la pidió). */
export function toAdminMerchantRequestResponse(
  request: MerchantRequest & { user: User }
): AdminMerchantRequestResponse {
  return {
    ...toMerchantRequestResponse(request),
    userId: request.userId,
    userEmail: request.user.email,
    userDisplayName: request.user.displayName,
    contactVerifiedAt: request.contactVerifiedAt ? request.contactVerifiedAt.toISOString() : null,
  };
}

/** Precio de un producto en la sucursal del comercio. */
export function toMerchantPriceResponse(
  price: Price & { productVariant: ProductVariant & { product: Product & { brand: Brand | null } } }
): MerchantPriceResponse {
  return {
    id: price.id,
    productName: prettifyProductName(price.productVariant.product.name),
    productVariantId: price.productVariantId,
    productVariantName: price.productVariant.name,
    category: price.productVariant.product.category,
    unit: price.productVariant.unit,
    unitSize: price.productVariant.unitSize,
    price: Number(price.price),
    updatedAt: price.updatedAt.toISOString(),
    displayName: price.displayName,
    brandName: prettifyBrandName(price.productVariant.product.brand?.name),
    productType: price.productVariant.product.productType,
    sourceType: price.sourceType,
  };
}

/** Qué traer junto con un precio: variante, producto y marca. */
export const merchantPriceInclude = { productVariant: { include: { product: { include: { brand: true } } } } } as const;
