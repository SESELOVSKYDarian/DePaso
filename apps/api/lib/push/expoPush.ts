import { prisma } from "@depaso/database";

/**
 * Envío de notificaciones al celular con el servicio de Expo (Expo Push). Expo se encarga de
 * hablar con Apple y Google; acá solo se le pasan los mensajes en tandas de hasta 100.
 * Los tokens que Expo marca como `DeviceNotRegistered` (app desinstalada) se borran.
 */
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  /** Lo que la app usa al tocar el aviso (a qué pantalla ir). */
  data?: Record<string, unknown>;
}

interface Ticket {
  status: "ok" | "error";
  details?: { error?: string };
}

/** Manda los mensajes y devuelve cuántos salieron bien. Nunca tira error: un aviso que falla no rompe nada. */
export async function sendPushMessages(messages: PushMessage[]): Promise<number> {
  let sent = 0;
  const deadTokens: string[] = [];

  for (let start = 0; start < messages.length; start += CHUNK_SIZE) {
    const chunk = messages.slice(start, start + CHUNK_SIZE);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map((message) => ({ ...message, sound: "default", channelId: "default", priority: "high" }))),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        console.error("push: Expo respondió", response.status);
        continue;
      }
      const body = (await response.json()) as { data?: Ticket[] };
      (body.data ?? []).forEach((ticket, index) => {
        if (ticket.status === "ok") sent += 1;
        else if (ticket.details?.error === "DeviceNotRegistered") deadTokens.push(chunk[index]!.to);
      });
    } catch (error) {
      console.error("push: no se pudo enviar una tanda", error);
    }
  }

  if (deadTokens.length > 0) await prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } });
  return sent;
}
