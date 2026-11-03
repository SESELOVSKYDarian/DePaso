import { prisma } from "@depaso/database";
import { buildPersonalFeed } from "../activity/personalFeed";
import { sendPushMessages, type PushMessage } from "./expoPush";

/** Como mucho un aviso de ofertas por persona cada 20 horas. */
const MIN_GAP_MS = 20 * 60 * 60 * 1000;
/** Personas que se revisan por corrida (evita colgar la API si hay muchas). */
const MAX_USERS_PER_RUN = 200;
/** Solo de día: nadie quiere una oferta a las 3 de la mañana. */
const FIRST_HOUR = 9;
const LAST_HOUR = 21;

function argentinaHour(now: Date): number {
  const hour = new Intl.DateTimeFormat("es-AR", { hour: "numeric", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(now);
  return Number(hour) % 24;
}

/**
 * Avisa por notificación del celular si hay una baja de precio o una oferta cerca para lo que
 * tiene en sus listas. Se corre cada unas horas; cada persona recibe como mucho un aviso por día.
 */
export async function sendOffersPush(now: Date = new Date()): Promise<{ users: number; sent: number }> {
  const hour = argentinaHour(now);
  if (hour < FIRST_HOUR || hour >= LAST_HOUR) return { users: 0, sent: 0 };

  const candidates = await prisma.user.findMany({
    where: {
      deletedAt: null,
      pushTokens: { some: {} },
      OR: [
        { notificationSettings: null },
        { notificationSettings: { offers: true, OR: [{ offersLastPushAt: null }, { offersLastPushAt: { lt: new Date(now.getTime() - MIN_GAP_MS) } }] } },
      ],
    },
    select: { id: true, pushTokens: { select: { token: true } } },
    take: MAX_USERS_PER_RUN,
  });

  let sent = 0;
  let notified = 0;
  for (const user of candidates) {
    const feed = await buildPersonalFeed(user.id, now);
    const offers = feed.filter((item) => item.type === "PRICE_DROP" || item.type === "CHEAP_NEARBY");
    const top = offers[0];
    if (!top) continue;

    const extra = offers.length > 1 ? ` y ${offers.length - 1} más` : "";
    const messages: PushMessage[] = user.pushTokens.map((row: (typeof user.pushTokens)[number]) => ({
      to: row.token,
      title: top.title,
      body: `${top.detail}${extra}`,
      data: { type: "offers" },
    }));
    sent += await sendPushMessages(messages);
    notified += 1;
    await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: { offersLastPushAt: now },
      create: { userId: user.id, offersLastPushAt: now },
    });
  }
  return { users: notified, sent };
}
