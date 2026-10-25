import { PrismaClient } from "@prisma/client";

/**
 * Ajusta la URL de la base para funciones serverless (Vercel). Cada instancia abre su propio
 * pool; con el pooler de Supabase en "session mode" (puerto 5432, tope de 15 clientes) unas
 * pocas búsquedas simultáneas agotaban las conexiones (`EMAXCONNSESSION`) y el buscador
 * devolvía vacío. En serverless:
 *  - el pooler de Supabase se usa en "transaction mode" (puerto 6543, `pgbouncer=true`), que
 *    reparte pocas conexiones reales entre muchos clientes;
 *  - cada instancia usa pocas conexiones (`connection_limit=3`): con una sola, las consultas de una misma búsqueda se hacían en fila.
 * Fuera de serverless (dev local, scripts) la URL queda como está.
 */
export function serverlessDatabaseUrl(raw: string | undefined, serverless: boolean): string | undefined {
  if (!raw || !serverless) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  if (url.hostname.endsWith(".pooler.supabase.com") && url.port === "5432") {
    url.port = "6543";
    url.searchParams.set("pgbouncer", "true");
  }
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "3");
  return url.toString();
}

/**
 * Singleton de PrismaClient — evita agotar conexiones en dev con hot-reload (patrón
 * estándar de Next.js + Prisma) y reusa el cliente entre invocaciones de una misma instancia.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = serverlessDatabaseUrl(process.env.DATABASE_URL, Boolean(process.env.VERCEL));

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);

globalForPrisma.prisma = prisma;
