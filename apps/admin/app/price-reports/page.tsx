"use client";

import type { AdminPriceReportResponse, ModerationActionInput } from "@depaso/validation";
import { colors, radii, spacing } from "@depaso/design-tokens";
import { Fragment, useCallback, useEffect, useState } from "react";
import { adminOpsClient } from "@/lib/apiClient";

const MODERATION_TYPES: { value: ModerationActionInput["type"]; label: string }[] = [
  { value: "REPORT_HIDDEN", label: "Ocultar reporte" },
  { value: "REPORT_WEIGHTED_DOWN", label: "Bajar peso" },
  { value: "REPORT_REJECTED", label: "Rechazar" },
  { value: "USER_SUSPENDED", label: "Suspender usuario" },
];

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

/**
 * Reportes comunitarios + moderación (Fase 20). Implementa FLOWS.md "Flujo de moderación y
 * apelación" (p.8): el admin puede ponderar/ocultar/rechazar/suspender dejando trazabilidad
 * interna (`CommunityModerationEvent`) — nunca borra el reporte original.
 */
export default function PriceReportsPage() {
  const [reports, setReports] = useState<AdminPriceReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ModerationActionInput["type"]>("REPORT_HIDDEN");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { reports: fetched } = await adminOpsClient.priceReports.list();
      setReports(fetched);
    } catch {
      setError("No pudimos cargar los reportes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmitModeration = async (reportId: string) => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await adminOpsClient.moderation.act({ targetPriceReportId: reportId, type: actionType, reason: reason.trim() });
      setOpenId(null);
      setReason("");
      await load();
    } catch {
      setError("No pudimos registrar la acción de moderación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h1 style={{ fontSize: 22 }}>Reportes comunitarios y moderación</h1>
      {error ? <p style={{ color: colors.state.error }}>{error}</p> : null}
      {isLoading ? (
        <p>Cargando...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: colors.text.secondary }}>Todavía no hay reportes comunitarios.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border.subtle}` }}>
              <th style={{ padding: spacing.xs }}>Producto</th>
              <th style={{ padding: spacing.xs }}>Comercio</th>
              <th style={{ padding: spacing.xs }}>Precio</th>
              <th style={{ padding: spacing.xs }}>Reportado por</th>
              <th style={{ padding: spacing.xs }}>Evidencia</th>
              <th style={{ padding: spacing.xs }}>Moderación</th>
              <th style={{ padding: spacing.xs }} />
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <Fragment key={r.id}>
                <tr style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                  <td style={{ padding: spacing.xs }}>{r.productName}</td>
                  <td style={{ padding: spacing.xs }}>
                    {r.storeName} — {r.branchName}
                  </td>
                  <td style={{ padding: spacing.xs }}>
                    {money(r.reportedPrice)}
                    {r.requiresPromotion ? ` (promo: ${r.promotionNote ?? "s/d"})` : ""}
                  </td>
                  <td style={{ padding: spacing.xs }}>{r.userEmail}</td>
                  <td style={{ padding: spacing.xs }}>{r.hasEvidence ? "Sí" : "No"}</td>
                  <td style={{ padding: spacing.xs, fontSize: 12, color: colors.text.secondary }}>
                    {r.moderationEvents.length > 0
                      ? r.moderationEvents.map((e) => e.type).join(", ")
                      : "—"}
                  </td>
                  <td style={{ padding: spacing.xs, textAlign: "right" }}>
                    <button
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      style={{ border: "none", background: "none", color: colors.brand.route, cursor: "pointer" }}
                    >
                      {openId === r.id ? "Cerrar" : "Moderar"}
                    </button>
                  </td>
                </tr>
                {openId === r.id ? (
                  <tr style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                    <td colSpan={7} style={{ padding: spacing.sm, backgroundColor: colors.surface.secondary }}>
                      <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" }}>
                        <select
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value as ModerationActionInput["type"])}
                          style={{ minHeight: 36, borderRadius: radii.md, border: `1px solid ${colors.border.subtle}` }}
                        >
                          {MODERATION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Motivo (obligatorio, queda en la trazabilidad interna)"
                          style={{
                            flex: 1,
                            minWidth: 260,
                            minHeight: 36,
                            borderRadius: radii.md,
                            border: `1px solid ${colors.border.subtle}`,
                            padding: `0 ${spacing.sm}px`,
                          }}
                        />
                        <button
                          onClick={() => void handleSubmitModeration(r.id)}
                          disabled={isSubmitting || !reason.trim()}
                          style={{
                            minHeight: 36,
                            padding: `0 ${spacing.md}px`,
                            borderRadius: radii.md,
                            border: "none",
                            backgroundColor: colors.brand.navy,
                            color: colors.text.onNavy,
                            cursor: "pointer",
                            opacity: isSubmitting || !reason.trim() ? 0.6 : 1,
                          }}
                        >
                          {isSubmitting ? "Guardando..." : "Confirmar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
