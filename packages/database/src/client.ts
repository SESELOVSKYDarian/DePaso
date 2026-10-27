import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient — evita agotar conexiones en dev con hot-reload (patrón
 * estándar de Next.js + Prisma). La URL (`DATABASE_URL`, MySQL) la carga EasyPanel como
 * variable de entorno; nunca va en el repo.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;
