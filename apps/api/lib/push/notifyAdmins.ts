import { prisma } from "@depaso/database";
import { runInBackground } from "../http/background";
import { notifyUsers } from "./notify";

/** Avisa al celular de todos los administradores (por ejemplo, cuando llega un pedido de publicidad). */
export function notifyAdmins(input: { title: string; body: string; data: Record<string, unknown> }): void {
  runInBackground(async () => {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", deletedAt: null }, select: { id: true } });
    if (admins.length === 0) return;
    await notifyUsers({ category: "news", userIds: admins.map((admin: (typeof admins)[number]) => admin.id), ...input });
  });
}
