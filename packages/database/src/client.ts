import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient — evita agotar conexiones en dev con hot-reload (patrón
 * estándar de Next.js + Prisma).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
