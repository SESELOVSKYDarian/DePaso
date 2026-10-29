import type { MerchantBranchResponse, MerchantPriceResponse } from "@depaso/validation";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { merchantClient } from "@/lib/apiClient";
import type { Facets } from "./types";

/**
 * Los datos del panel del comercio: su sucursal y sus precios con búsqueda, filtros y paginado.
 * Una sucursal importada trae miles de precios, por eso la lista se pide por tandas al servidor.
 */
export function useMerchantPrices() {
  const [branch, setBranch] = useState<MerchantBranchResponse | null>(null);
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [prices, setPrices] = useState<MerchantPriceResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Facets>({ types: [], brands: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  // sirve para descartar respuestas viejas si se escribe rápido
  const requestId = useRef(0);
  const trimmed = query.trim();
  const hasFilters = trimmed.length > 0 || typeId !== null || brandId !== null;

  // la sucursal que administra
  useEffect(() => {
    merchantClient
      .branch()
      .then(({ branch: found }) => setBranch(found))
      .catch(() => setBranch(null));
  }, []);

  // al volver de editar un precio se recarga la lista
  useFocusEffect(
    useCallback(() => {
      setReload((n) => n + 1);
    }, []),
  );

  // la primera tanda de precios, cada vez que cambia el texto o un filtro (con una pausa al escribir)
  useEffect(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    const timer = setTimeout(
      () => {
        merchantClient.prices
          .list({ q: trimmed || undefined, type: typeId ?? undefined, brandId: brandId ?? undefined })
          .then((response) => {
            if (id !== requestId.current) return;
            setPrices(response.prices);
            setTotal(response.total);
            setFacets(response.facets);
            setFailed(false);
          })
          .catch(() => {
            if (id === requestId.current) setFailed(true);
          })
          .finally(() => {
            if (id === requestId.current) setIsLoading(false);
          });
      },
      trimmed ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [trimmed, typeId, brandId, reload]);

  // la siguiente tanda, al llegar al final de la lista
  const loadMore = () => {
    if (isLoadingMore || isLoading || prices.length >= total) return;
    setIsLoadingMore(true);
    const id = requestId.current;
    merchantClient.prices
      .list({ q: trimmed || undefined, type: typeId ?? undefined, brandId: brandId ?? undefined, offset: prices.length })
      .then((response) => {
        if (id === requestId.current) setPrices((current) => [...current, ...response.prices]);
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingMore(false));
  };

  const clearFilters = () => {
    setQuery("");
    setTypeId(null);
    setBrandId(null);
  };

  // al elegir un tipo se limpia la marca (las marcas dependen del tipo)
  const pickType = (id: string | null) => {
    setTypeId(id);
    setBrandId(null);
  };

  return {
    branch, query, setQuery, typeId, brandId, setBrandId, prices, total, facets,
    isLoading, isLoadingMore, failed, hasFilters, trimmed, loadMore, clearFilters, pickType,
  };
}
