import type { MerchantRequest, Price, Product, ProductVariant, User } from "@depaso/database";
import type {
  AdminMerchantRequestResponse,
  MerchantPriceResponse,
  MerchantRequestResponse,
} from "@depaso/validation";

export function normalizeName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function toMerchantRequestResponse(request: MerchantRequest): MerchantRequestResponse {
  return {
    id: request.id,
    businessName: request.businessName,
    address: request.address,
    phone: request.phone,
    note: request.note,
    status: request.status,
    rejectionReason: request.rejectionReason,
    createdAt: request.createdAt.toISOString(),
    reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
  };
}

export function toAdminMerchantRequestResponse(
  request: MerchantRequest & { user: User }
): AdminMerchantRequestResponse {
  return {
    ...toMerchantRequestResponse(request),
    userId: request.userId,
    userEmail: request.user.email,
    userDisplayName: request.user.displayName,
  };
}

export function toMerchantPriceResponse(
  price: Price & { productVariant: ProductVariant & { product: Product } }
): MerchantPriceResponse {
  return {
    id: price.id,
    productName: price.productVariant.product.name,
    productVariantId: price.productVariantId,
    productVariantName: price.productVariant.name,
    category: price.productVariant.product.category,
    unit: price.productVariant.unit,
    unitSize: price.productVariant.unitSize,
    price: Number(price.price),
    updatedAt: price.updatedAt.toISOString(),
  };
}

export const merchantPriceInclude = { productVariant: { include: { product: true } } } as const;
