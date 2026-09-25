import { prisma } from "@depaso/database";
import type { ShoppingList, ShoppingListItem, ShoppingListMember, User } from "@depaso/database";
import type { ShoppingListItemResponse, ShoppingListResponse, ShoppingListSummary } from "@depaso/validation";

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
async function loadProductNames(productIds: string[]): Promise<Map<string, { name: string; category: string }>> {
  if (productIds.length === 0) return new Map();
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, category: true },
  });
  return new Map(products.map((p: (typeof products)[number]) => [p.id, { name: p.name, category: p.category }]));
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
  productNames: Map<string, { name: string; category: string }>
): ShoppingListItemResponse {
  const product = productNames.get(item.productId);
  return {
    id: item.id,
    productId: item.productId,
    productName: product?.name ?? "Producto no encontrado",
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
