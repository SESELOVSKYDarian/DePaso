import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

/**
 * Carga en la base los logos de las cadenas (`seed/store-logos/*.png` + `brands.json`).
 * Se puede correr las veces que haga falta: actualiza lo que ya está. Lo corre solo el
 * contenedor de la API al arrancar, así los logos siempre salen de la base de datos.
 *
 *   pnpm --filter @depaso/database db:brand-logos
 */
const FOLDER = join(dirname(fileURLToPath(import.meta.url)), "..", "seed", "store-logos");

interface BrandEntry {
  slug: string;
  name: string;
  aliases: string[];
}

async function main() {
  const prisma = new PrismaClient();
  const brands = JSON.parse(readFileSync(join(FOLDER, "brands.json"), "utf8")) as BrandEntry[];

  for (const brand of brands) {
    // leo el archivo del logo
    const image = readFileSync(join(FOLDER, `${brand.slug}.png`));
    const aliases = [...new Set(brand.aliases)].map((alias) => ({ alias }));
    // guardo logo y alias (los alias se reemplazan completos)
    await prisma.brandLogo.upsert({
      where: { slug: brand.slug },
      create: { slug: brand.slug, name: brand.name, mimeType: "image/png", image, aliases: { create: aliases } },
      update: { name: brand.name, mimeType: "image/png", image, aliases: { deleteMany: {}, create: aliases } },
    });
  }
  console.log(`Logos cargados: ${brands.length}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("No se pudieron cargar los logos:", error);
  process.exit(1);
});
