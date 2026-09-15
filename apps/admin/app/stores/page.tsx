"use client";

import type { StoreResponse } from "@depaso/validation";
import { colors, radii, spacing } from "@depaso/design-tokens";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminCatalogClient } from "@/lib/apiClient";

/** CRUD de comercios (Fase 11) — las sucursales se administran desde el detalle de cada uno. */
export default function StoresPage() {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { stores: fetched } = await adminCatalogClient.stores.list();
      setStores(fetched);
    } catch {
      setError("No pudimos cargar los comercios.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await adminCatalogClient.stores.create({ name: name.trim() });
      setName("");
      await load();
    } catch {
      setError("No pudimos crear el comercio.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminCatalogClient.stores.remove(id);
      await load();
    } catch {
      setError("No se pudo eliminar — puede tener sucursales asociadas.");
    }
  };

  return (
    <main style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 22 }}>Comercios</h1>
      {error ? <p style={{ color: colors.state.error }}>{error}</p> : null}

      <form onSubmit={(e) => void handleCreate(e)} style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del comercio"
          style={{ flex: 1, minHeight: 40, borderRadius: radii.md, border: `1px solid ${colors.border.subtle}`, padding: `0 ${spacing.sm}px` }}
        />
        <button type="submit" style={{ minHeight: 40, padding: `0 ${spacing.md}px`, borderRadius: radii.md, border: "none", backgroundColor: colors.brand.navy, color: colors.text.onNavy, cursor: "pointer" }}>
          Crear
        </button>
      </form>

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border.subtle}` }}>
              <th style={{ padding: spacing.xs }}>Nombre</th>
              <th style={{ padding: spacing.xs }}>Sucursales</th>
              <th style={{ padding: spacing.xs }} />
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <td style={{ padding: spacing.xs }}>
                  <Link href={`/stores/${store.id}`}>{store.name}</Link>
                </td>
                <td style={{ padding: spacing.xs }}>{store.branchCount}</td>
                <td style={{ padding: spacing.xs, textAlign: "right" }}>
                  <button
                    onClick={() => void handleDelete(store.id)}
                    style={{ border: "none", background: "none", color: colors.state.error, cursor: "pointer" }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
