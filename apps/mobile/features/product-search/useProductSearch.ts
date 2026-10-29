import { PRODUCT_TYPE_GROUPS } from "@depaso/domain";
import type { ProductFacets, ProductSearchResult } from "@depaso/validation";
import { useEffect, useRef, useState } from "react";
import { EMPTY_FACETS, cachedFacets, cachedSearch, groupOfType } from "./helpers";

/**
 * Estado del buscador: el texto, los filtros (categoría, tipo, marca) y los resultados.
 * Cada cambio vuelve a buscar, con una pausa corta mientras se tipea.
 */
export function useProductSearch() {
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [brand, setBrand] = useState<{ id: string; name: string } | null>(null);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [facets, setFacets] = useState<ProductFacets>(EMPTY_FACETS);
  const [isSearching, setIsSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  const requestId = useRef(0);
  const trimmed = query.trim();
  const hasCriteria = trimmed.length > 0 || typeId !== null || brand !== null;
  const group = PRODUCT_TYPE_GROUPS.find((g) => g.id === groupId) ?? (typeId ? groupOfType(typeId) : null);

  // busco cada vez que cambia el texto o un filtro
  useEffect(() => {
    if (!hasCriteria) {
      setResults([]);
      setFacets(EMPTY_FACETS);
      setFailed(false);
      return;
    }
    const id = ++requestId.current;
    const filters = { type: typeId ?? undefined, brandId: brand?.id };
    setIsSearching(true);
    const timer = setTimeout(
      async () => {
        const key = { q: trimmed, type: filters.type, brandId: filters.brandId };
        const [found, options] = await Promise.all([
          cachedSearch(key).then((results) => ({ results })).catch(() => null),
          cachedFacets(key).catch(() => null),
        ]);
        if (id !== requestId.current) return; // llegó tarde: ya hay una búsqueda más nueva
        // Un error de red no es "no existe": se avisa distinto y se puede reintentar.
        setFailed(found === null);
        setResults(found?.results ?? []);
        if (options) setFacets(options);
        setIsSearching(false);
      },
      trimmed ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [trimmed, typeId, brand, hasCriteria, retry]);

  // al entrar a una categoría se precargan sus primeros tipos
  useEffect(() => {
    if (!groupId || typeId) return;
    const current = PRODUCT_TYPE_GROUPS.find((g) => g.id === groupId);
    for (const id of current?.typeIds.slice(0, 6) ?? []) {
      void cachedSearch({ q: "", type: id }).catch(() => undefined);
      void cachedFacets({ q: "", type: id }).catch(() => undefined);
    }
  }, [groupId, typeId]);

  // al abrir el buscador se precargan, de a poco, las cajas más usadas: cuando se tocan ya están
  useEffect(() => {
    const popular = ["gaseosa", "leche", "arroz", "pasta", "yerba", "galletita"];
    const timers = popular.map((id, index) =>
      setTimeout(() => {
        void cachedSearch({ q: "", type: id }).catch(() => undefined);
        void cachedFacets({ q: "", type: id }).catch(() => undefined);
      }, 400 + index * 350),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const pickType = (id: string | null) => {
    setTypeId(id);
    setBrand(null);
  };

  const goHome = () => {
    setGroupId(null);
    pickType(null);
  };

  return {
    query, setQuery, trimmed, hasCriteria,
    group, groupId, setGroupId,
    typeId, pickType, brand, setBrand, goHome,
    results, facets, isSearching, failed, retryAgain: () => setRetry((n) => n + 1),
  };
}
