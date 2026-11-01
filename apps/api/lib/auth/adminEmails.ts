import { prisma } from "@depaso/database";

/**
 * Mails que deben ser administradores: variable `ADMIN_EMAILS` (separados por coma).
 * Una cuenta se promueve sólo si ya confirmó su mail: así nadie puede quedarse con el rol
 * registrándose antes que su dueño con ese mismo mail.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

type Role = "USER" | "MERCHANT" | "ADMIN";

/** Si el mail está en `ADMIN_EMAILS` y está confirmado, le pone rol ADMIN. Devuelve el rol vigente. */
export async function ensureAdminRole(user: {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: Date | null;
}): Promise<Role> {
  if (user.role === "ADMIN" || !user.emailVerifiedAt || !isAdminEmail(user.email)) return user.role;
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return "ADMIN";
}

/** Al arrancar: promueve a los mails de `ADMIN_EMAILS` que ya existen y están confirmados. */
export async function promoteConfiguredAdmins(): Promise<number> {
  const emails = adminEmails();
  if (emails.length === 0) return 0;
  const result = await prisma.user.updateMany({
    where: { email: { in: emails }, emailVerifiedAt: { not: null }, role: { not: "ADMIN" }, deletedAt: null },
    data: { role: "ADMIN" },
  });
  return result.count;
}
