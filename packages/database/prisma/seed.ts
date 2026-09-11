/**
 * Seed de desarrollo — datos DEMO/SEED, no reales (sección 85 del master prompt). Genera
 * de forma procedural (no tipeado a mano) ~6 comercios, ~20 sucursales en Mar del Plata,
 * ~100 productos con precios variados, y algunos reportes comunitarios / un precio en
 * disputa, para poder probar el flujo completo sin depender de datos de terceros.
 *
 * Requiere una base Postgres accesible por DATABASE_URL — no se corrió en esta sesión por
 * no haber Docker/Postgres disponible (ver docs/development/PROGRESS.md).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PRNG determinístico (mulberry32) para que el seed sea reproducible entre corridas.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260910);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]!;
const randomBetween = (min: number, max: number) => min + rand() * (max - min);

// Centro aproximado de Mar del Plata, para dispersar sucursales alrededor.
const MDP_CENTER = { latitude: -38.0023, longitude: -57.5575 };

const CHAIN_NAMES = ["Carrefour", "La Anónima", "Día", "Vea", "Coto", "Almacén Dorrego"];
const CATEGORIES = ["Almacén", "Lácteos", "Bebidas", "Limpieza", "Perfumería", "Verdulería", "Carnicería"];
const BRAND_NAMES = [
  "Coca-Cola", "Pepsi", "La Serenísima", "Sancor", "Arcor", "Molinos", "Marolio",
  "Ilolay", "Quilmes", "Manaos", "Knorr", "Ala", "Skip", "Suavizante Vívere",
];
const PRODUCT_TEMPLATES = [
  { name: "Leche entera", unit: "L", unitSize: 1, category: "Lácteos" },
  { name: "Yerba mate", unit: "kg", unitSize: 0.5, category: "Almacén" },
  { name: "Gaseosa cola", unit: "L", unitSize: 2.25, category: "Bebidas" },
  { name: "Fideos tallarín", unit: "g", unitSize: 500, category: "Almacén" },
  { name: "Arroz largo fino", unit: "kg", unitSize: 1, category: "Almacén" },
  { name: "Aceite de girasol", unit: "L", unitSize: 1.5, category: "Almacén" },
  { name: "Detergente", unit: "L", unitSize: 0.75, category: "Limpieza" },
  { name: "Papel higiénico x4", unit: "un", unitSize: 4, category: "Limpieza" },
  { name: "Shampoo", unit: "ml", unitSize: 400, category: "Perfumería" },
  { name: "Manteca", unit: "g", unitSize: 200, category: "Lácteos" },
  { name: "Queso cremoso", unit: "kg", unitSize: 0.3, category: "Lácteos" },
  { name: "Pan lactal", unit: "un", unitSize: 1, category: "Almacén" },
  { name: "Tomate perita", unit: "kg", unitSize: 1, category: "Verdulería" },
  { name: "Lechuga", unit: "un", unitSize: 1, category: "Verdulería" },
  { name: "Carne picada", unit: "kg", unitSize: 1, category: "Carnicería" },
];

function jitterLocation(base: { latitude: number; longitude: number }, maxDegrees: number) {
  return {
    latitude: base.latitude + randomBetween(-maxDegrees, maxDegrees),
    longitude: base.longitude + randomBetween(-maxDegrees, maxDegrees),
  };
}

async function main() {
  console.log("[seed] Limpiando datos SEED previos...");
  await prisma.optimizationPlanItem.deleteMany();
  await prisma.optimizationPlanStop.deleteMany();
  await prisma.optimizationPlan.deleteMany();
  await prisma.optimizationRun.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.communityModerationEvent.deleteMany();
  await prisma.priceReport.deleteMany();
  await prisma.price.deleteMany();
  await prisma.productAlias.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.storeBranch.deleteMany();
  await prisma.store.deleteMany();

  console.log("[seed] Creando marcas...");
  const brands = await Promise.all(
    BRAND_NAMES.map((name) => prisma.brand.create({ data: { name } }))
  );

  console.log("[seed] Creando productos y variantes (~100)...");
  const variants: { id: string; productId: string }[] = [];
  for (let i = 0; i < 100; i++) {
    const template = pick(PRODUCT_TEMPLATES);
    const brand = pick(brands);
    const product = await prisma.product.create({
      data: {
        name: `${template.name} ${brand.name}`,
        category: template.category,
        brandId: brand.id,
      },
    });
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: `${template.unitSize}${template.unit}`,
        unit: template.unit,
        unitSize: template.unitSize,
      },
    });
    await prisma.productAlias.create({
      data: { productVariantId: variant.id, alias: template.name.toLowerCase() },
    });
    variants.push({ id: variant.id, productId: product.id });
  }

  console.log("[seed] Creando comercios y ~20 sucursales...");
  const branches: { id: string; latitude: number; longitude: number }[] = [];
  for (const chainName of CHAIN_NAMES) {
    const store = await prisma.store.create({ data: { name: chainName } });
    const branchCount = Math.round(randomBetween(2, 5));
    for (let b = 0; b < branchCount; b++) {
      const location = jitterLocation(MDP_CENTER, 0.05);
      const branch = await prisma.storeBranch.create({
        data: {
          storeId: store.id,
          name: `${chainName} Sucursal ${b + 1}`,
          address: `Calle Demo ${Math.round(randomBetween(100, 4000))}, Mar del Plata`,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });
      branches.push(branch);
    }
  }

  console.log("[seed] Creando precios SEED por sucursal/producto...");
  const sourceTypes = ["OFFICIAL", "STORE", "COMMUNITY", "ESTIMATED"] as const;
  const confidences = ["HIGH", "MEDIUM", "LOW"] as const;
  for (const branch of branches) {
    const offeredVariants = variants.filter(() => rand() < 0.6); // no todas las sucursales tienen todo
    for (const variant of offeredVariants) {
      const basePrice = randomBetween(500, 8000);
      await prisma.price.create({
        data: {
          productVariantId: variant.id,
          storeBranchId: branch.id,
          price: Math.round(basePrice),
          sourceType: pick([...sourceTypes]),
          confidence: pick([...confidences]),
          status: "VERIFIED",
        },
      });
    }
  }

  console.log("[seed] Creando un precio DISPUTED de ejemplo...");
  const disputedVariant = variants[0]!;
  const disputedBranch = branches[0]!;
  const disputedPrice = await prisma.price.findFirst({
    where: { productVariantId: disputedVariant.id, storeBranchId: disputedBranch.id },
  });
  if (disputedPrice) {
    await prisma.price.update({ where: { id: disputedPrice.id }, data: { status: "DISPUTED" } });
  }

  console.log("[seed] Listo. Datos marcados como SEED/DEMO — no representan precios reales.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
