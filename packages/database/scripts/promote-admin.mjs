/**
 * Promueve una cuenta existente a `role: "ADMIN"` (Fase 11/12 — no hay alta de admin
 * autoservicio ni MFA todavía, ver `lib/auth/requireAdmin.ts` en `apps/api`). Uso:
 *
 *   node packages/database/scripts/promote-admin.mjs alguien@ejemplo.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];
if (!email) {
  console.error("Uso: node promote-admin.mjs <email>");
  process.exit(1);
}

const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
console.log(`${user.email} -> ${user.role}`);
await prisma.$disconnect();
