"use client";

import type { AdminOptimizationRunResponse } from "@depaso/validation";
import { colors, spacing } from "@depaso/design-tokens";
import { useEffect, useState } from "react";
import { adminOpsClient } from "@/lib/apiClient";

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

/** Observabilidad de corridas del motor de optimización (Fase 20). */
export default function OptimizationRunsPage() {
  const [runs, setRuns] = useState<AdminOptimizationRunResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminOpsClient.optimizationRuns
      .list()
      .then(({ runs: fetched }) => setRuns(fetched))
      .catch(() => setError("No pudimos cargar las corridas."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main>
      <h1 style={{ fontSize: 22 }}>Optimization runs</h1>
      {error ? <p style={{ color: colors.state.error }}>{error}</p> : null}
      {isLoading ? (
        <p>Cargando...</p>
      ) : runs.length === 0 ? (
        <p style={{ color: colors.text.secondary }}>Todavía no hay corridas registradas.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border.subtle}` }}>
              <th style={{ padding: spacing.xs }}>Usuario</th>
              <th style={{ padding: spacing.xs }}>Modo</th>
              <th style={{ padding: spacing.xs }}>Transporte</th>
              <th style={{ padding: spacing.xs }}>Planes</th>
              <th style={{ padding: spacing.xs }}>Mejor ahorro</th>
              <th style={{ padding: spacing.xs }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <td style={{ padding: spacing.xs }}>{r.userEmail}</td>
                <td style={{ padding: spacing.xs }}>{r.mode}</td>
                <td style={{ padding: spacing.xs }}>{r.transportMode}</td>
                <td style={{ padding: spacing.xs }}>{r.planCount}</td>
                <td style={{ padding: spacing.xs }}>{r.bestEstimatedSavings != null ? money(r.bestEstimatedSavings) : "—"}</td>
                <td style={{ padding: spacing.xs }}>{new Date(r.createdAt).toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
