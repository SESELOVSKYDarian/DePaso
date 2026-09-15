"use client";

import type { StoreBranchResponse } from "@depaso/validation";
import { colors, radii, spacing } from "@depaso/design-tokens";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { adminCatalogClient } from "@/lib/apiClient";

const emptyForm = { name: "", address: "", latitude: "", longitude: "", city: "Mar del Plata" };

/** Sucursales de un comercio (Fase 11). */
export default function StoreBranchesPage() {
  const { id: storeId } = useParams<{ id: string }>();
  const [branches, setBranches] = useState<StoreBranchResponse[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { branches: fetched } = await adminCatalogClient.branches.list(storeId);
      setBranches(fetched);
    } catch {
      setError("No pudimos cargar las sucursales.");
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!form.name.trim() || !form.address.trim() || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Completá nombre, dirección y coordenadas válidas.");
      return;
    }
    try {
      await adminCatalogClient.branches.create({ storeId, name: form.name.trim(), address: form.address.trim(), latitude, longitude, city: form.city });
      setForm(emptyForm);
      setError(null);
      await load();
    } catch {
      setError("No pudimos crear la sucursal.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminCatalogClient.branches.remove(id);
      await load();
    } catch {
      setError("No pudimos eliminar la sucursal.");
    }
  };

  return (
    <main style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22 }}>Sucursales</h1>
      {error ? <p style={{ color: colors.state.error }}>{error}</p> : null}

      <form onSubmit={(e) => void handleCreate(e)} style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }}>
        <input placeholder="Nombre de sucursal" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
        <input placeholder="Dirección" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} style={{ ...inputStyle, minWidth: 220 }} />
        <input placeholder="Latitud" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} style={{ ...inputStyle, width: 100 }} />
        <input placeholder="Longitud" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} style={{ ...inputStyle, width: 100 }} />
        <input placeholder="Ciudad" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={inputStyle} />
        <button type="submit" style={buttonStyle}>
          Agregar
        </button>
      </form>

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border.subtle}` }}>
              <th style={{ padding: spacing.xs }}>Nombre</th>
              <th style={{ padding: spacing.xs }}>Dirección</th>
              <th style={{ padding: spacing.xs }}>Ciudad</th>
              <th style={{ padding: spacing.xs }} />
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id} style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <td style={{ padding: spacing.xs }}>{branch.name}</td>
                <td style={{ padding: spacing.xs }}>{branch.address}</td>
                <td style={{ padding: spacing.xs }}>{branch.city}</td>
                <td style={{ padding: spacing.xs, textAlign: "right" }}>
                  <button onClick={() => void handleDelete(branch.id)} style={{ border: "none", background: "none", color: colors.state.error, cursor: "pointer" }}>
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

const inputStyle: React.CSSProperties = {
  minHeight: 40,
  borderRadius: radii.md,
  border: `1px solid ${colors.border.subtle}`,
  padding: `0 ${spacing.sm}px`,
};

const buttonStyle: React.CSSProperties = {
  minHeight: 40,
  padding: `0 ${spacing.md}px`,
  borderRadius: radii.md,
  border: "none",
  backgroundColor: colors.brand.navy,
  color: colors.text.onNavy,
  cursor: "pointer",
};
