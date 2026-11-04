import { prisma } from "@depaso/database";
import type { ActivityItem, ActivitySummary } from "@depaso/validation";

const pesos = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;
const KIND_LABEL = { FEATURED_PRODUCT: "producto destacado", BANNER: "banner", IMAGE: "imagen", VIDEO: "video" } as const;
const RESULT_WINDOW_DAYS = 14;
const LOGIN_WINDOW_DAYS = 30;

/** Cuántas cosas esperan al administrador (solicitudes de comercio y pedidos de publicidad). */
async function adminCounts(): Promise<{ merchantRequests: number; adRequests: number }> {
  const [merchantRequests, adRequests] = await Promise.all([
    prisma.merchantRequest.count({ where: { status: "PENDING" } }),
    prisma.adRequest.count({ where: { status: "PENDING" } }),
  ]);
  return { merchantRequests, adRequests };
}

/** Los numeritos de la app. Para un usuario común es siempre 0: solo cuentan cosas que esperan su respuesta. */
export async function buildActivitySummary(userId: string, role: string): Promise<ActivitySummary> {
  if (role === "ADMIN") {
    const counts = await adminCounts();
    return { badge: counts.merchantRequests + counts.adRequests, ...counts };
  }
  if (role === "MERCHANT") {
    const badge = await prisma.adRequest.count({ where: { userId, status: "COUNTER" } });
    return { badge, merchantRequests: 0, adRequests: 0 };
  }
  return { badge: 0, merchantRequests: 0, adRequests: 0 };
}

/** Avisos del administrador: solicitudes de comercio y pedidos de publicidad por revisar. */
async function adminItems(): Promise<ActivityItem[]> {
  const [requests, ads] = await Promise.all([
    prisma.merchantRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.adRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { displayName: true, email: true } } } }),
  ]);
  const fromRequests: ActivityItem[] = requests.map((row: (typeof requests)[number]) => ({
    id: `merchant-request-${row.id}`,
    type: "MERCHANT_REQUEST" as const,
    title: `${row.businessName} quiere ser comercio`,
    detail: "Revisá la solicitud y confirmá que trabaja ahí antes de aprobarla.",
    at: row.createdAt.toISOString(),
    listId: null,
    route: "/admin/merchant-requests",
    needsAction: true,
  }));
  const fromAds: ActivityItem[] = ads.map((row: (typeof ads)[number]) => ({
    id: `ad-request-${row.id}`,
    type: "AD_REQUEST" as const,
    title: `${row.user.displayName ?? row.user.email} pidió publicidad`,
    detail: `${KIND_LABEL[row.kind]} por ${row.durationDays} días: ofrece ${pesos(Number(row.offeredAmount))}.`,
    at: row.createdAt.toISOString(),
    listId: null,
    route: "/admin/ads",
    needsAction: true,
  }));
  return [...fromRequests, ...fromAds];
}

/** Avisos del comercio: contraofertas por responder y cómo terminó cada pedido reciente. */
async function merchantItems(userId: string, now: Date): Promise<ActivityItem[]> {
  const since = new Date(now.getTime() - RESULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await prisma.adRequest.findMany({
    where: { userId, OR: [{ status: "COUNTER" }, { status: { in: ["APPROVED", "REJECTED"] }, reviewedAt: { gte: since } }] },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });
  return rows.map((row: (typeof rows)[number]): ActivityItem => {
    if (row.status === "COUNTER") {
      return {
        id: `ad-counter-${row.id}`,
        type: "AD_COUNTER",
        title: `El equipo propone ${pesos(Number(row.counterAmount ?? 0))} por "${row.title}"`,
        detail: `Vos ofreciste ${pesos(Number(row.offeredAmount))}. Podés aceptar, rechazar o proponer otro monto.`,
        at: row.updatedAt.toISOString(),
        listId: null,
        route: "/merchant/ads",
        needsAction: true,
      };
    }
    const approved = row.status === "APPROVED";
    return {
      id: `ad-result-${row.id}`,
      type: "AD_RESULT",
      title: approved ? `Aprobaron tu publicidad "${row.title}"` : `No aprobaron tu publicidad "${row.title}"`,
      detail: approved ? `Ya se muestra en la app por ${row.durationDays} días.` : (row.adminNote ?? "Mirá el motivo en tu panel."),
      at: (row.reviewedAt ?? row.updatedAt).toISOString(),
      listId: null,
      route: "/merchant/ads",
      needsAction: false,
    };
  });
}

/** Inicios de sesión recientes: cuándo y desde qué dispositivo, para detectar accesos raros. */
async function loginItems(userId: string, now: Date): Promise<ActivityItem[]> {
  const since = new Date(now.getTime() - LOGIN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await prisma.loginEvent.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 5 });
  return rows.map((row: (typeof rows)[number]) => ({
    id: `login-${row.id}`,
    type: "LOGIN" as const,
    title: "Iniciaste sesión",
    detail: `${row.device ?? "Dispositivo desconocido"}${row.ip ? ` · IP ${row.ip}` : ""}. Si no fuiste vos, cambiá tu contraseña.`,
    at: row.createdAt.toISOString(),
    listId: null,
    route: null,
    needsAction: false,
  }));
}

/** Los avisos que dependen del rol y de la cuenta: administración, comercio y accesos. */
export async function buildRoleItems(userId: string, role: string, now: Date = new Date()): Promise<ActivityItem[]> {
  const [roleItems, logins] = await Promise.all([
    role === "ADMIN" ? adminItems() : role === "MERCHANT" ? merchantItems(userId, now) : Promise.resolve([] as ActivityItem[]),
    loginItems(userId, now),
  ]);
  return [...roleItems, ...logins];
}
