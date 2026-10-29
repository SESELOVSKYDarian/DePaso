import { Prisma } from "@depaso/database";

/** Palabras que no ayudan a encontrar nada y harían candidatos a casi todo el catálogo. */
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "con", "sin", "y", "en", "x", "para"]);

export interface ProductSearchFilters {
  /** Id de tipo (`"gaseosa"`, `"vino"`…), ver `@depaso/domain`. */
  type?: string | undefined;
  brandId?: string | undefined;
}

/** Minúsculas, sin acentos, espacios colapsados — igual que `Product.normalizedName`. */
export function normalizeQuery(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Escapa `%`, `_` y `\` para que el texto buscado no se tome como comodín de SQL. */
export function escapeLike(token: string): string {
  return token.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export const nameExpr = Prisma.sql`COALESCE(p.normalizedName, lower(p.name))`;
export const brandExpr = Prisma.sql`lower(COALESCE(b.name, ''))`;

/** Palabras de la búsqueda que realmente filtran (sin conectores). */
export function searchTokens(normalized: string): string[] {
  if (!normalized) return [];
  const all = normalized.split(" ");
  const meaningful = all.filter((token) => !STOPWORDS.has(token));
  return meaningful.length > 0 ? meaningful : all;
}

/** Condiciones que dependen de las palabras buscadas (nombre o marca). */
export function textConditions(tokens: string[]): Prisma.Sql[] {
  const singleLetter = tokens.length === 1 && (tokens[0]?.length ?? 0) < 2;
  return tokens.map((token) => {
    const pattern = singleLetter ? `${escapeLike(token)}%` : `%${escapeLike(token)}%`;
    return Prisma.sql`(${nameExpr} LIKE ${pattern} OR ${brandExpr} LIKE ${pattern})`;
  });
}

/** Condiciones SQL de los filtros elegidos (tipo y marca). */
export function filterConditions(filters: ProductSearchFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];
  if (filters.type) conditions.push(Prisma.sql`p.productType = ${filters.type}`);
  if (filters.brandId) conditions.push(Prisma.sql`p.brandId = ${filters.brandId}`);
  return conditions;
}

/** Une las condiciones con AND en un WHERE (o nada si no hay ninguna). */
export function whereClause(conditions: Prisma.Sql[]): Prisma.Sql {
  return conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
}
