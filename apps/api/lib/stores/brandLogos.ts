import { prisma } from "@depaso/database";
import type { BrandLogosResponse } from "@depaso/validation";

/** Todos los logos guardados en la base, con sus nombres de reconocimiento. */
export async function loadBrandLogos(): Promise<BrandLogosResponse> {
  const rows = await prisma.brandLogo.findMany({
    orderBy: { name: "asc" },
    include: { aliases: { select: { alias: true } } },
  });
  return {
    logos: rows.map((row: (typeof rows)[number]) => ({
      slug: row.slug,
      name: row.name,
      aliases: row.aliases.map((entry: (typeof row.aliases)[number]) => entry.alias),
      imageDataUri: `data:${row.mimeType};base64,${Buffer.from(row.image).toString("base64")}`,
    })),
  };
}
