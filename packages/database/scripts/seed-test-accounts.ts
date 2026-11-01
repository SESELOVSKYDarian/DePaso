/**
 * Cuentas de prueba: un comercio y dos usuarios comunes, con lugares, rutas guardadas, listas
 * (una compartida) y, para el comercio, una sucursal con precios cargados.
 *
 * Es idempotente (se puede correr las veces que haga falta) y no hace nada si falta la variable
 * `TEST_ACCOUNTS_PASSWORD`: la contraseña no está en el repositorio. Las cuentas nacen con el
 * mail ya confirmado, así que no hace falta recibir ningún código.
 *
 *   TEST_ACCOUNTS_PASSWORD="una-clave-larga" pnpm --filter @depaso/database run db:test-accounts
 *
 * En EasyPanel alcanza con definir la variable y redesplegar: el arranque la ejecuta solo.
 */
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient, type PlaceType } from "@prisma/client";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

const EMAILS = {
  merchant: "comercio.prueba@depaso.test",
  ana: "ana.prueba@depaso.test",
  luis: "luis.prueba@depaso.test",
};

// Mar del Plata: puntos reales de la ciudad para que las rutas tengan sentido en el mapa
const PLACES: Record<string, { name: string; type: PlaceType; address: string; latitude: number; longitude: number }> = {
  casa: { name: "Casa", type: "HOME", address: "Güemes 2500, Mar del Plata", latitude: -37.9985, longitude: -57.547 },
  trabajo: { name: "Trabajo", type: "WORK", address: "Av. Colón 1500, Mar del Plata", latitude: -38.001, longitude: -57.5525 },
  gym: { name: "Gimnasio", type: "GYM", address: "Av. Independencia 2000, Mar del Plata", latitude: -37.9958, longitude: -57.5498 },
  facultad: { name: "Facultad", type: "STUDY", address: "Funes 3350, Mar del Plata", latitude: -37.9902, longitude: -57.5879 },
};

/** Mismo formato que `apps/api/lib/auth/password.ts` (scrypt, sal:hash en hexadecimal). */
async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(plain, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

async function upsertUser(email: string, displayName: string, role: "USER" | "MERCHANT", passwordHash: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { displayName, role, passwordHash, deletedAt: null, emailVerifiedAt: new Date() },
    create: { email, displayName, role, passwordHash, emailVerifiedAt: new Date() },
  });
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, ageConfirmed18Plus: true, marketingOptIn: false },
  });
  for (const type of ["TERMS", "PRIVACY"] as const) {
    const exists = await prisma.userConsent.findFirst({ where: { userId: user.id, type } });
    if (!exists) await prisma.userConsent.create({ data: { userId: user.id, type, documentVersion: "seed", accepted: true } });
  }
  return user;
}

async function addPlaces(userId: string, keys: string[]) {
  const ids: Record<string, string> = {};
  for (const key of keys) {
    const place = PLACES[key]!;
    const found = await prisma.userPlace.findFirst({ where: { userId, name: place.name } });
    const saved = found ?? (await prisma.userPlace.create({ data: { userId, ...place, isFavorite: key === "casa" || key === "trabajo" } }));
    ids[key] = saved.id;
  }
  return ids;
}

async function addRoute(userId: string, name: string, placeKeys: string[], placeIds: Record<string, string>) {
  if (await prisma.savedRouteContext.findFirst({ where: { userId, name } })) return;
  await prisma.savedRouteContext.create({
    data: {
      userId,
      name,
      stops: {
        create: placeKeys.map((key, position) => {
          const place = PLACES[key]!;
          const emoji = place.type === "HOME" ? "🏠" : place.type === "WORK" ? "💼" : place.type === "GYM" ? "🏋️" : "📍";
          return {
            position,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            emoji,
            placeId: placeIds[key] ?? null,
          };
        }),
      },
    },
  });
}

async function addList(userId: string, name: string, productIds: string[]) {
  const found = await prisma.shoppingList.findFirst({ where: { userId, name } });
  if (found) return found;
  return prisma.shoppingList.create({
    data: { userId, name, items: { create: productIds.map((productId, i) => ({ productId, quantity: (i % 3) + 1 })) } },
  });
}

/** Productos del catálogo con variante; si la base está vacía se crean unos pocos de ejemplo. */
async function catalogProducts() {
  const found = await prisma.product.findMany({
    where: { variants: { some: {} } },
    orderBy: { popularity: "desc" },
    take: 14,
    include: { variants: { take: 1 } },
  });
  if (found.length >= 8) return found;

  const demo = [
    ["Leche entera 1 L", "Lácteos", "L", 1],
    ["Yerba mate 1 kg", "Almacén", "kg", 1],
    ["Fideos tirabuzón 500 g", "Almacén", "g", 500],
    ["Arroz largo fino 1 kg", "Almacén", "kg", 1],
    ["Aceite de girasol 900 ml", "Almacén", "ml", 900],
    ["Gaseosa cola 2,25 L", "Bebidas", "L", 2.25],
    ["Detergente 750 ml", "Limpieza", "ml", 750],
    ["Azúcar 1 kg", "Almacén", "kg", 1],
  ] as const;
  for (const [name, category, unit, unitSize] of demo) {
    if (await prisma.product.findFirst({ where: { name } })) continue;
    await prisma.product.create({ data: { name, category, variants: { create: { name, unit, unitSize } } } });
  }
  return prisma.product.findMany({ where: { variants: { some: {} } }, orderBy: { popularity: "desc" }, take: 14, include: { variants: { take: 1 } } });
}

/** Sucursal del comercio de prueba, con sus precios (un poco por debajo del mejor precio conocido). */
async function seedMerchantBranch(ownerUserId: string, products: Awaited<ReturnType<typeof catalogProducts>>) {
  let store = await prisma.store.findFirst({ where: { name: "Almacén Prueba" } });
  if (!store) store = await prisma.store.create({ data: { name: "Almacén Prueba", normalizedName: "almacen prueba" } });

  let branch = await prisma.storeBranch.findFirst({ where: { storeId: store.id, ownerUserId } });
  if (!branch) {
    branch = await prisma.storeBranch.create({
      data: {
        storeId: store.id,
        ownerUserId,
        name: "Almacén Prueba - Sucursal Centro",
        address: "Av. Independencia 2400, Mar del Plata",
        latitude: -37.9965,
        longitude: -57.55,
      },
    });
  }

  for (const product of products) {
    const variant = product.variants[0];
    if (!variant) continue;
    if (await prisma.price.findFirst({ where: { productVariantId: variant.id, storeBranchId: branch.id } })) continue;
    const best = await prisma.price.aggregate({ where: { productVariantId: variant.id, price: { gt: 0 } }, _min: { price: true } });
    const reference = best._min.price ? Number(best._min.price) : 1200 + (product.name.length % 9) * 350;
    const amount = Math.max(100, Math.round((reference * 0.94) / 10) * 10);
    const price = await prisma.price.create({
      data: {
        productVariantId: variant.id,
        storeBranchId: branch.id,
        price: amount,
        sourceType: "STORE",
        confidence: "HIGH",
        status: "VERIFIED",
      },
    });
    await prisma.priceHistory.create({ data: { priceId: price.id, amount, status: "VERIFIED", changeReason: "Precio inicial de prueba" } });
  }
  return branch;
}

async function main() {
  const password = process.env.TEST_ACCOUNTS_PASSWORD;
  if (!password) {
    console.log("cuentas de prueba: falta TEST_ACCOUNTS_PASSWORD, no se cargan");
    return;
  }
  if (password.length < 8) throw new Error("TEST_ACCOUNTS_PASSWORD debe tener al menos 8 caracteres");
  const passwordHash = await hashPassword(password);

  const products = await catalogProducts();
  const productIds = products.map((p) => p.id);

  const merchant = await upsertUser(EMAILS.merchant, "Comercio de Prueba", "MERCHANT", passwordHash);
  const ana = await upsertUser(EMAILS.ana, "Ana Prueba", "USER", passwordHash);
  const luis = await upsertUser(EMAILS.luis, "Luis Prueba", "USER", passwordHash);

  await seedMerchantBranch(merchant.id, products);

  const anaPlaces = await addPlaces(ana.id, ["casa", "trabajo", "gym"]);
  await addRoute(ana.id, "Trabajo → Casa", ["trabajo", "casa"], anaPlaces);
  await addRoute(ana.id, "Casa → Gimnasio → Trabajo", ["casa", "gym", "trabajo"], anaPlaces);
  await addList(ana.id, "Compra de la semana", productIds.slice(0, 8));
  await addList(ana.id, "Limpieza y almacén", productIds.slice(5, 11));

  const luisPlaces = await addPlaces(luis.id, ["casa", "facultad", "trabajo"]);
  await addRoute(luis.id, "Casa → Facultad", ["casa", "facultad"], luisPlaces);
  const compartida = await addList(luis.id, "Lista compartida con Ana", productIds.slice(2, 10));
  await addList(luis.id, "Para el finde", productIds.slice(0, 6));
  await prisma.shoppingListMember.upsert({
    where: { shoppingListId_userId: { shoppingListId: compartida.id, userId: ana.id } },
    update: {},
    create: { shoppingListId: compartida.id, userId: ana.id },
  });

  for (const user of [ana, luis]) {
    await prisma.userPaymentMethod.upsert({
      where: { userId_methodSlug: { userId: user.id, methodSlug: "mercado-pago" } },
      update: {},
      create: { userId: user.id, methodSlug: "mercado-pago" },
    });
  }

  console.log(`cuentas de prueba listas: ${Object.values(EMAILS).join(", ")}`);
}

main()
  .catch((error) => {
    console.error("cuentas de prueba: falló", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
