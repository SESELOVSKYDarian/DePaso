import { prisma } from "@depaso/database";
import type { ShoppingList, ShoppingListItem, ShoppingListMember, User } from "@depaso/database";
import type { ShoppingListItemResponse, ShoppingListResponse, ShoppingListSummary } from "@depaso/validation";
import { prettifyBrandName, prettifyProductName } from "../catalog/productNames";

/** Relaciones que necesita `toListResponse` (dueño y miembros con su usuario). */
export const listInclude = { items: true, user: true, members: { include: { user: true } } } as const;

type ListWithItems = ShoppingList & {
  items: ShoppingListItem[];
  user: User;
  members: (ShoppingListMember & { user: User })[];
};

/** Filtro de acceso: la lista es del usuario o se la compartieron. */
export function listAccessWhere(userId: string) {
  return { OR: [{ userId }, { members: { some: { userId } } }] };
}

/**
 * `ShoppingListItem.productId` no tiene relación de Prisma hacia `Product` (Fase 9 sólo
 * agrega listas sobre el catálogo ya modelado en Fase 8) — se resuelve el nombre/categoría
 * con una consulta aparte en vez de forzar una FK que el schema original no declaró.
 */
interface ListProductInfo {
  name: string;
  category: string;
  brandName: string | null;
  imageUrl: string | null;
}

async function loadProductNames(productIds: string[]): Promise<Map<string, ListProductInfo>> {
  if (productIds.length === 0) return new Map();
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, category: true, imageUrl: true, brand: { select: { name: true } } },
  });
  return new Map(
    products.map((p: (typeof products)[number]) => [
      p.id,
      {
        name: prettifyProductName(p.name),
        category: p.category,
        brandName: prettifyBrandName(p.brand?.name),
        imageUrl: p.imageUrl,
      },
    ])
  );
}

export async function toListResponse(list: ListWithItems, viewerId: string): Promise<ShoppingListResponse> {
  const productNames = await loadProductNames(list.items.map((item) => item.productId));

  return {
    id: list.id,
    name: list.name,
    archivedAt: list.archivedAt?.toISOString() ?? null,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
    role: list.userId === viewerId ? "OWNER" : "MEMBER",
    ownerName: list.user.displayName ?? list.user.email,
    members: list.members.map((member) => ({
      userId: member.userId,
      email: member.user.email,
      displayName: member.user.displayName,
    })),
    items: list.items.map((item) => toItemResponse(item, productNames)),
  };
}

function toItemResponse(
  item: ShoppingListItem,
  productNames: Map<string, ListProductInfo>
): ShoppingListItemResponse {
  const product = productNames.get(item.productId);
  return {
    id: item.id,
    productId: item.productId,
    productName: product?.name ?? "Producto no encontrado",
    brandName: product?.brandName ?? null,
    imageUrl: product?.imageUrl ?? null,
    category: product?.category ?? "",
    quantity: item.quantity,
    note: item.note,
  };
}

export function toListSummary(
  list: ShoppingList & { user: User; _count: { items: number; members: number } },
  viewerId: string
): ShoppingListSummary {
  return {
    id: list.id,
    name: list.name,
    archivedAt: list.archivedAt?.toISOString() ?? null,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
    role: list.userId === viewerId ? "OWNER" : "MEMBER",
    ownerName: list.user.displayName ?? list.user.email,
    memberCount: list._count.members,
    itemCount: list._count.items,
  };
}
