"use client";

import type { AdminUserResponse } from "@depaso/validation";
import { colors, spacing } from "@depaso/design-tokens";
import { useEffect, useState } from "react";
import { adminOpsClient } from "@/lib/apiClient";

/** Vista de usuarios (Fase 20) — sólo lectura, sin cambio de rol self-service (ver
 * apps/api/app/api/admin/users/route.ts). */
export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminOpsClient.users
      .list()
      .then(({ users: fetched }) => setUsers(fetched))
      .catch(() => setError("No pudimos cargar los usuarios."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main>
      <h1 style={{ fontSize: 22 }}>Usuarios</h1>
      {error ? <p style={{ color: colors.state.error }}>{error}</p> : null}
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border.subtle}` }}>
              <th style={{ padding: spacing.xs }}>Email</th>
              <th style={{ padding: spacing.xs }}>Nombre</th>
              <th style={{ padding: spacing.xs }}>Rol</th>
              <th style={{ padding: spacing.xs }}>Trust score</th>
              <th style={{ padding: spacing.xs }}>Reportes</th>
              <th style={{ padding: spacing.xs }}>Creado</th>
              <th style={{ padding: spacing.xs }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <td style={{ padding: spacing.xs }}>{u.email}</td>
                <td style={{ padding: spacing.xs }}>{u.displayName ?? "—"}</td>
                <td style={{ padding: spacing.xs }}>{u.role}</td>
                <td style={{ padding: spacing.xs }}>{u.trustScore ? u.trustScore.score.toFixed(2) : "—"}</td>
                <td style={{ padding: spacing.xs }}>
                  {u.trustScore ? `${u.trustScore.reportsConfirmed}/${u.trustScore.reportsSubmitted}` : "—"}
                </td>
                <td style={{ padding: spacing.xs }}>{new Date(u.createdAt).toLocaleDateString("es-AR")}</td>
                <td style={{ padding: spacing.xs, color: u.deletedAt ? colors.state.error : colors.state.success }}>
                  {u.deletedAt ? "Eliminado" : "Activo"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
