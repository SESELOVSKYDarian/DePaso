"use client";

import type { PriceResponse, ProductSearchResult, StoreBranchResponse } from "@depaso/validation";
import { colors, radii, spacing } from "@depaso/design-tokens";
import { useCallback, useEffect, useState } from "react";
import { adminCatalogClient, productsClient } from "@/lib/apiClient";

/**
 * Carga manual de precios (Fase 12 — la ingestión automática real sigue NO DEFINIDA). Cada
 * actualización pide un motivo porque queda en `PriceHistory` (BUSINESS-RULES.md p.7:
 * "nunca sobreescribir sin histórico").
 */
export default function PricesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [variant, setVariant] = useState<{ id: string; name: string; productName: string } | null>(null);
  const [branches, setBranches] = useState<StoreBranchResponse[]>([]);
  const [branchId, setBranchId] = useState("");
  const [prices, setPrices] = useState<PriceResponse[]>([]);
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminCatalogClient.branches.list().then(({ branches: fetched }) => setBranches(fetched));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const { results: found } = await productsClient.search(query.trim());
    setResults(found);
  };

  const loadPrices = useCallback(async (variantId: string, currentBranchId: string) => {
    if (!currentBranchId) {
      setPrices([]);
      return;
    }
    const { prices: fetched } = await adminCatalogClient.prices.list({ productVariantId: variantId, storeBranchId: currentBranchId });
    setPrices(fetched);
  }, []);

  useEffect(() => {
    if (variant && branchId) void loadPrices(variant.id, branchId);
  }, [variant, branchId, loadPrices]);

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant || !branchId) return;
    const amount = Number(newPrice);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Ingresá un precio válido.");
      return;
    }
    try {
      await adminCatalogClient.prices.create({
        productVariantId: variant.id,
        storeBranchId: branchId,
        price: amount,
        sourceType: "STORE",
        confidence: "HIGH",
      });
      setNewPrice("");
      setError(null);
      await loadPrices(variant.id, branchId);
    } catch {
      setError("No pudimos guardar el precio.");
    }
  };

  const handleUpdatePrice = async (priceId: string, amount: number) => {
    const changeReason = window.prompt("Motivo del cambio (queda en el histórico):");
    if (!changeReason) return;
    try {
      await adminCatalogClient.prices.update(priceId, { price: amount, changeReason });
      if (variant) await loadPrices(variant.id, branchId);
    } catch {
      setError("No pudimos actualizar el precio.");
    }
  };

  return (
    <main style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22 }}>Precios</h1>
      {error ? <p style={{ color: colors.state.error }}>{error}</p> : null}

      <form onSubmit={(e) => void handleSearch(e)} style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.md }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto" style={inputStyle} />
        <button type="submit" style={buttonStyle}>
          Buscar
        </button>
      </form>

      {!variant && results.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, marginBottom: spacing.lg }}>
          {results.map((product) =>
            product.variants.map((v) => (
              <li key={v.id} style={{ padding: spacing.xs, borderBottom: `1px solid ${colors.border.subtle}` }}>
                <button
                  onClick={() => setVariant({ id: v.id, name: v.name, productName: product.name })}
                  style={{ border: "none", background: "none", color: colors.brand.route, cursor: "pointer", fontSize: 14 }}
                >
                  {product.name} — {v.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {variant ? (
        <div style={{ marginBottom: spacing.lg }}>
          <p>
            <strong>
              {variant.productName} — {variant.name}
            </strong>{" "}
            <button onClick={() => setVariant(null)} style={{ border: "none", background: "none", color: colors.text.secondary, cursor: "pointer" }}>
              (cambiar)
            </button>
          </p>

          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={{ ...inputStyle, marginBottom: spacing.sm }}>
            <option value="">Elegí una sucursal...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.storeName} — {b.name}
              </option>
            ))}
          </select>

          {branchId ? (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: spacing.md }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border.subtle}` }}>
                    <th style={{ padding: spacing.xs }}>Precio</th>
                    <th style={{ padding: spacing.xs }}>Estado</th>
                    <th style={{ padding: spacing.xs }}>Actualizado</th>
                    <th style={{ padding: spacing.xs }} />
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                      <td style={{ padding: spacing.xs }}>
                        ${p.price} {p.currency}
                      </td>
                      <td style={{ padding: spacing.xs }}>{p.status}</td>
                      <td style={{ padding: spacing.xs }}>{new Date(p.updatedAt).toLocaleString("es-AR")}</td>
                      <td style={{ padding: spacing.xs, textAlign: "right" }}>
                        <button
                          onClick={() => {
                            const next = window.prompt("Nuevo precio:", String(p.price));
                            const amount = Number(next);
                            if (next && !Number.isNaN(amount)) void handleUpdatePrice(p.id, amount);
                          }}
                          style={{ border: "none", background: "none", color: colors.brand.route, cursor: "pointer" }}
                        >
                          Actualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {prices.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: spacing.xs, color: colors.text.muted }}>
                        Sin precio cargado todavía para esta combinación.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <form onSubmit={(e) => void handleCreatePrice(e)} style={{ display: "flex", gap: spacing.sm }}>
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Nuevo precio (ARS)"
                  style={inputStyle}
                />
                <button type="submit" style={buttonStyle}>
                  Cargar precio
                </button>
              </form>
            </>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  minHeight: 40,
  borderRadius: radii.md,
  border: `1px solid ${colors.border.subtle}`,
  padding: `0 ${spacing.sm}px`,
  flex: 1,
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
