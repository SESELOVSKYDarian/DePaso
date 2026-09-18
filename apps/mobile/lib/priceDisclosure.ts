/**
 * Divulgación obligatoria por precio mostrado (BUSINESS-RULES.md p.9: "Monto, Sucursal,
 * Fuente, Recencia, Confianza, Disputa si existe, Aviso"). Funciones puras — sin JSX, para
 * poder testear sin renderer.
 */

const SOURCE_LABELS: Record<string, string> = {
  OFFICIAL_SEPA: "Fuente oficial (SEPA)",
  OFFICIAL: "Fuente oficial",
  STORE: "Publicado por el comercio",
  RETAILER_ONLINE: "Sitio del comercio",
  COMMUNITY: "Reportado por la comunidad",
  RECEIPT: "Ticket de compra",
  MANUAL_ADMIN: "Carga manual",
  MERCHANT: "Publicado por el comercio",
  ESTIMATED: "Estimado",
};

export function sourceTypeLabel(sourceType: string | undefined): string {
  if (!sourceType) return "Fuente desconocida";
  return SOURCE_LABELS[sourceType] ?? "Fuente desconocida";
}

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: "Confianza alta",
  MEDIUM: "Confianza media",
  LOW: "Confianza baja",
};

export function confidenceLabel(confidence: string | undefined): string | null {
  if (!confidence) return null;
  return CONFIDENCE_LABELS[confidence] ?? null;
}

/** "Actualizado hace 2h" (BUSINESS-RULES.md p.9, ejemplo literal de la doc). */
export function formatRecency(reportedAt: string | undefined): string | null {
  if (!reportedAt) return null;
  const then = new Date(reportedAt).getTime();
  if (Number.isNaN(then)) return null;
  const diffMs = Date.now() - then;
  if (diffMs < 0) return "Actualizado recién";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Actualizado recién";
  if (minutes < 60) return `Actualizado hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Actualizado hace ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Actualizado hace ${days} ${days === 1 ? "día" : "días"}`;

  return "Puede estar desactualizado";
}

/** Microcopy legal obligatorio (BUSINESS-RULES.md p.9, texto literal de la doc). */
export const PRICE_DISCLOSURE_NOTICE =
  "Los precios y ahorros son estimaciones informativas y pueden variar por sucursal, stock, " +
  "promociones, medios de pago o actualizaciones. Verificá el precio final en el comercio.";
