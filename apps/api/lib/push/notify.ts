import { prisma } from "@depaso/database";
import { sendPushMessages, type PushMessage } from "./expoPush";

/** Categorías que la persona puede activar o apagar en el celular. */
export type PushCategory = "news" | "offers" | "lists";

interface NotifyInput {
  category: PushCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Solo a estas personas; sin esto, a todas las que tienen la categoría activa. */
  userIds?: string[];
}

/**
 * Manda un aviso a las personas que lo quieren: tienen el celular registrado y no apagaron esa
 * categoría. Sin ajustes guardados se asume que está todo activo.
 */
export async function notifyUsers(input: NotifyInput): Promise<number> {
  const tokens = await prisma.pushToken.findMany({
    where: {
      ...(input.userIds ? { userId: { in: input.userIds } } : {}),
      user: { deletedAt: null, OR: [{ notificationSettings: null }, { notificationSettings: { [input.category]: true } }] },
    },
    select: { token: true },
  });
  if (tokens.length === 0) return 0;

  const messages: PushMessage[] = tokens.map((row: (typeof tokens)[number]) => ({
    to: row.token,
    title: input.title,
    body: input.body,
    ...(input.data ? { data: input.data } : {}),
  }));
  return sendPushMessages(messages);
}
